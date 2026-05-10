// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {BaseQuiz} from "../src/BaseQuiz.sol";
import {IEAS, AttestationRequest, AttestationRequestData} from "../lib/IEAS.sol";
import {ISchemaRegistry} from "../lib/ISchemaRegistry.sol";

/// @notice Fork tests against the real EAS predeploys on Base Mainnet.
/// Run with:
///   forge test --match-path test/BaseQuiz.fork.t.sol \
///              --fork-url $BASE_RPC_URL -vvv
///
/// EAS on Base Mainnet:
///   EAS:            0x4200000000000000000000000000000000000021
///   SchemaRegistry: 0x4200000000000000000000000000000000000020
contract BaseQuizForkTest is Test {
    address constant EAS_ADDR             = 0x4200000000000000000000000000000000000021;
    address constant SCHEMA_REGISTRY_ADDR = 0x4200000000000000000000000000000000000020;

    BaseQuiz public quiz;
    bytes32  public schemaUID;

    uint256 internal signerKey = 0xA11CE;
    address internal signerAddr;
    address internal owner = address(0xB055);
    address internal alice = address(0xA1);

    bytes32 internal constant VERDICT_TYPEHASH = keccak256(
        "AnswerVerdict(address user,uint16 questionId,bool correct,bytes32 nonce,uint32 deadline)"
    );

    function setUp() public {
        // Sanity: skip the file silently if RPC isn't configured (CI without secrets).
        try this.requireBaseMainnetFork() {} catch {
            vm.skip(true);
            return;
        }

        signerAddr = vm.addr(signerKey);

        // 1. Register the level schema on the real Base SchemaRegistry.
        ISchemaRegistry registry = ISchemaRegistry(SCHEMA_REGISTRY_ADDR);
        schemaUID = registry.register(
            "uint8 level,uint32 totalCorrect,uint64 timestamp,uint16 quizVersion",
            address(0),
            false
        );

        // 2. Deploy BaseQuiz pointing at the real EAS predeploy.
        quiz = new BaseQuiz(signerAddr, IEAS(EAS_ADDR), schemaUID, owner);

        console2.log("Forked Base mainnet. Schema UID:");
        console2.logBytes32(schemaUID);
    }

    /// Used as a soft RPC probe so the suite skips itself without --fork-url.
    function requireBaseMainnetFork() external view {
        require(block.chainid == 8453, "Not a Base Mainnet fork");
    }

    // ====== Helpers ======

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("BaseQuiz")),
                keccak256(bytes("1")),
                block.chainid,
                address(quiz)
            )
        );
    }

    function _sign(
        address user,
        uint16  questionId,
        bool    correct,
        bytes32 nonce,
        uint32  deadline
    ) internal view returns (bytes memory) {
        bytes32 structHash = keccak256(
            abi.encode(VERDICT_TYPEHASH, user, questionId, correct, nonce, deadline)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(signerKey, digest);
        return abi.encodePacked(r, s, v);
    }

    // ====== Tests ======

    function test_fork_schema_registered() public view {
        ISchemaRegistry registry = ISchemaRegistry(SCHEMA_REGISTRY_ADDR);
        ISchemaRegistry.SchemaRecord memory rec = registry.getSchema(schemaUID);
        assertEq(rec.uid, schemaUID);
        assertEq(rec.revocable, false);
    }

    function test_fork_level_up_creates_real_eas_attestation() public {
        // Five correct answers → level 1 → real EAS attestation.
        for (uint16 i = 1; i <= 5; i++) {
            bytes32 nonce    = keccak256(abi.encodePacked("fork-n", i));
            uint32  deadline = uint32(block.timestamp + 1 hours);
            bytes memory sig = _sign(alice, i, true, nonce, deadline);

            vm.recordLogs();
            vm.prank(alice);
            quiz.submitAnswer(alice, i, true, nonce, deadline, sig);
        }

        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentLevel, 1);
        assertEq(s.totalCorrect, 5);
        // If we reached here without revert, EAS.attest() succeeded against the real predeploy.
        // The LevelUp event we emit carries the real attestationUID returned by EAS.
    }

    function test_fork_full_progression_to_level_3() public {
        // 15 correct → level 3 (3 real attestations).
        for (uint16 i = 1; i <= 15; i++) {
            bytes32 nonce    = keccak256(abi.encodePacked("fork-progress", i));
            uint32  deadline = uint32(block.timestamp + 1 hours);
            bytes memory sig = _sign(alice, i, true, nonce, deadline);

            vm.prank(alice);
            quiz.submitAnswer(alice, i, true, nonce, deadline, sig);
        }
        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentLevel, 3);
        assertEq(s.totalCorrect, 15);
    }
}
