// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEAS, AttestationRequest, AttestationRequestData} from "../lib/IEAS.sol";
import {EIP712}  from "openzeppelin-contracts/utils/cryptography/EIP712.sol";
import {ECDSA}   from "openzeppelin-contracts/utils/cryptography/ECDSA.sol";
import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";

/// @title BaseQuiz — onchain quiz about the Base ecosystem with EAS-backed level attestations
/// @notice
///   The user pays gas; correctness is determined off-chain by a trusted backend that
///   issues an EIP-712 signed AnswerVerdict for each submission. The contract enforces:
///   - streak progression (0..4, levels up on the 5th consecutive correct answer)
///   - per-question single-correct-solve
///   - 24h lockout per question on a wrong answer
///   - level cap at MAX_LEVEL (default 20)
///   - one-shot EAS attestation on every level-up
///
///   This design avoids the eth_call leak that a naive on-chain answer-hash check has:
///   the verdict itself contains the boolean outcome, and only one valid signature
///   exists per (user, questionId, nonce). Off-chain rate-limiting + onchain lockout
///   defend against brute-force across attempts.
contract BaseQuiz is EIP712, Ownable {
    // ========= Constants =========
    uint8  public constant STREAK_FOR_LEVEL_UP = 5;
    uint8  public constant MAX_LEVEL           = 20;
    uint32 public constant LOCKOUT_DURATION    = 24 hours;

    bytes32 public constant VERDICT_TYPEHASH = keccak256(
        "AnswerVerdict(address user,uint16 questionId,bool correct,bytes32 nonce,uint32 deadline)"
    );

    // ========= Immutable EAS wiring =========
    IEAS    public immutable eas;
    bytes32 public immutable levelSchemaUID;

    // ========= Mutable config =========
    address public trustedSigner;

    // ========= Storage =========
    struct UserState {
        uint8  currentStreak;     // 0..4 (resets to 0 on the 5th, after a level-up)
        uint8  currentLevel;      // 0..MAX_LEVEL
        uint32 totalCorrect;
        uint32 totalAnswered;
        uint32 lastActiveAt;
    }

    /// user => state
    mapping(address => UserState) public users;

    /// user => questionId => unix timestamp (0 if not locked)
    mapping(address => mapping(uint16 => uint32)) public lockoutUntil;

    /// user => questionId => true if already correctly answered
    mapping(address => mapping(uint16 => bool)) public solved;

    /// nonce => true if used (replay protection, global)
    mapping(bytes32 => bool) public usedNonces;

    // ========= Events =========
    event AnswerSubmitted(address indexed user, uint16 indexed questionId, bool correct, uint8 newStreak);
    event LevelUp(address indexed user, uint8 newLevel, uint32 totalCorrect, bytes32 attestationUID);
    event QuestionLocked(address indexed user, uint16 indexed questionId, uint32 lockedUntil);
    event SignerUpdated(address indexed previousSigner, address indexed newSigner);

    // ========= Errors =========
    error SignatureExpired();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error QuestionIsLocked();
    error AlreadySolved();
    error WrongUser();
    error ZeroAddress();

    // ========= Constructor =========
    constructor(
        address _trustedSigner,
        IEAS    _eas,
        bytes32 _levelSchemaUID,
        address _owner
    ) EIP712("BaseQuiz", "1") Ownable(_owner) {
        if (_trustedSigner == address(0)) revert ZeroAddress();
        if (address(_eas) == address(0))  revert ZeroAddress();
        if (_owner == address(0))         revert ZeroAddress();

        trustedSigner  = _trustedSigner;
        eas            = _eas;
        levelSchemaUID = _levelSchemaUID;
    }

    // ========= Core mutating call =========

    /// @notice Submit an answer verdict produced and signed by the trusted backend.
    /// @param user       The user the verdict is for (must equal msg.sender).
    /// @param questionId 1..100 (or whatever the live pool is).
    /// @param correct    Whether the user's answer was correct.
    /// @param nonce      Single-use random bytes32 issued by the backend.
    /// @param deadline   Unix timestamp after which the verdict is invalid.
    /// @param signature  EIP-712 signature from `trustedSigner` over the verdict.
    function submitAnswer(
        address user,
        uint16  questionId,
        bool    correct,
        bytes32 nonce,
        uint32  deadline,
        bytes calldata signature
    ) external {
        if (user != msg.sender)                             revert WrongUser();
        if (block.timestamp > deadline)                     revert SignatureExpired();
        if (usedNonces[nonce])                              revert NonceAlreadyUsed();
        if (solved[msg.sender][questionId])                 revert AlreadySolved();
        if (lockoutUntil[msg.sender][questionId] > block.timestamp) revert QuestionIsLocked();

        // ---- Verify EIP-712 signature ----
        bytes32 structHash = keccak256(
            abi.encode(VERDICT_TYPEHASH, user, questionId, correct, nonce, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        if (ECDSA.recover(digest, signature) != trustedSigner) revert InvalidSignature();

        // burn nonce regardless of outcome
        usedNonces[nonce] = true;

        UserState storage u = users[msg.sender];
        u.totalAnswered += 1;
        u.lastActiveAt   = uint32(block.timestamp);

        if (correct) {
            solved[msg.sender][questionId] = true;
            u.totalCorrect += 1;

            uint8 newStreak = u.currentStreak + 1;

            if (newStreak >= STREAK_FOR_LEVEL_UP) {
                // streak completes — always reset; level-up only when below cap
                u.currentStreak = 0;
                if (u.currentLevel < MAX_LEVEL) {
                    u.currentLevel += 1;
                    bytes32 uid = _attestLevel(msg.sender, u.currentLevel, u.totalCorrect);
                    emit LevelUp(msg.sender, u.currentLevel, u.totalCorrect, uid);
                }
            } else {
                u.currentStreak = newStreak;
            }

            emit AnswerSubmitted(msg.sender, questionId, true, u.currentStreak);
        } else {
            u.currentStreak = 0;
            uint32 until    = uint32(block.timestamp) + LOCKOUT_DURATION;
            lockoutUntil[msg.sender][questionId] = until;

            emit AnswerSubmitted(msg.sender, questionId, false, 0);
            emit QuestionLocked(msg.sender, questionId, until);
        }
    }

    // ========= EAS attestation =========

    function _attestLevel(address user, uint8 newLevel, uint32 totalCorrect) internal returns (bytes32) {
        AttestationRequestData memory data = AttestationRequestData({
            recipient:      user,
            expirationTime: 0,
            revocable:      false,
            refUID:         bytes32(0),
            data:           abi.encode(newLevel, totalCorrect, uint64(block.timestamp), uint16(1)),
            value:          0
        });
        AttestationRequest memory req = AttestationRequest({schema: levelSchemaUID, data: data});
        return eas.attest(req);
    }

    // ========= Admin =========

    function setTrustedSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerUpdated(trustedSigner, newSigner);
        trustedSigner = newSigner;
    }

    // ========= Views =========

    function getUserState(address user) external view returns (UserState memory) {
        return users[user];
    }

    function isLocked(address user, uint16 questionId) external view returns (bool locked, uint32 until) {
        until  = lockoutUntil[user][questionId];
        locked = until > block.timestamp;
    }

    // eip712Domain() is inherited from OpenZeppelin's EIP712 (returns the same fields).
}
