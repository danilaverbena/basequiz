// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {BaseQuiz} from "../src/BaseQuiz.sol";
import {IEAS, AttestationRequest, AttestationRequestData} from "../lib/IEAS.sol";

// ---- Mock EAS used in unit tests ----
contract MockEAS is IEAS {
    uint256 public attestCount;
    bytes32 public lastSchema;
    AttestationRequestData public lastData;

    function attest(AttestationRequest calldata request) external payable override returns (bytes32) {
        attestCount += 1;
        lastSchema  = request.schema;
        lastData    = request.data;
        return keccak256(abi.encode(request, attestCount));
    }
}

contract BaseQuizTest is Test {
    BaseQuiz public quiz;
    MockEAS  public eas;

    // EIP-712 signer
    uint256 internal signerKey   = 0xA11CE;
    address internal signerAddr;
    address internal owner       = address(0xB055);
    address internal alice       = address(0xA1);
    address internal bob         = address(0xB2);

    bytes32 internal constant SCHEMA_UID = keccak256("BaseQuizLevelV1");

    bytes32 internal constant VERDICT_TYPEHASH = keccak256(
        "AnswerVerdict(address user,uint16 questionId,bool correct,bytes32 nonce,uint32 deadline)"
    );

    function setUp() public {
        signerAddr = vm.addr(signerKey);
        eas        = new MockEAS();
        quiz       = new BaseQuiz(signerAddr, IEAS(address(eas)), SCHEMA_UID, owner);
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

    function _signVerdict(
        uint256 key,
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
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function _submit(
        address user,
        uint16  questionId,
        bool    correct,
        bytes32 nonce,
        uint32  deadline,
        uint256 signerKeyToUse
    ) internal {
        bytes memory sig = _signVerdict(signerKeyToUse, user, questionId, correct, nonce, deadline);
        vm.prank(user);
        quiz.submitAnswer(user, questionId, correct, nonce, deadline, sig);
    }

    // ====== Tests ======

    function test_constructor_sets_state() public view {
        assertEq(quiz.trustedSigner(), signerAddr);
        assertEq(address(quiz.eas()), address(eas));
        assertEq(quiz.levelSchemaUID(), SCHEMA_UID);
        assertEq(quiz.owner(), owner);
    }

    function test_correct_answer_increments_streak() public {
        _submit(alice, 1, true, keccak256("n1"), uint32(block.timestamp + 1 hours), signerKey);

        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentStreak, 1);
        assertEq(s.totalCorrect, 1);
        assertEq(s.totalAnswered, 1);
        assertEq(s.currentLevel, 0);
        assertTrue(quiz.solved(alice, 1));
        assertEq(eas.attestCount(), 0); // no level-up yet
    }

    function test_five_correct_in_row_levels_up_and_attests() public {
        for (uint16 i = 1; i <= 5; i++) {
            _submit(
                alice,
                i,
                true,
                keccak256(abi.encodePacked("nonce", i)),
                uint32(block.timestamp + 1 hours),
                signerKey
            );
        }
        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentLevel, 1);
        assertEq(s.currentStreak, 0); // resets after level-up
        assertEq(s.totalCorrect, 5);
        assertEq(eas.attestCount(), 1);
    }

    function test_two_levels_in_row() public {
        for (uint16 i = 1; i <= 10; i++) {
            _submit(
                alice,
                i,
                true,
                keccak256(abi.encodePacked("nonce", i)),
                uint32(block.timestamp + 1 hours),
                signerKey
            );
        }
        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentLevel, 2);
        assertEq(eas.attestCount(), 2);
    }

    function test_wrong_answer_resets_streak_and_locks_question() public {
        // build streak of 3
        for (uint16 i = 1; i <= 3; i++) {
            _submit(
                alice,
                i,
                true,
                keccak256(abi.encodePacked("n", i)),
                uint32(block.timestamp + 1 hours),
                signerKey
            );
        }
        // wrong on question 4
        _submit(alice, 4, false, keccak256("nW"), uint32(block.timestamp + 1 hours), signerKey);

        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentStreak, 0);
        assertEq(s.totalCorrect, 3);
        assertEq(s.totalAnswered, 4);

        (bool locked, uint32 until) = quiz.isLocked(alice, 4);
        assertTrue(locked);
        assertEq(until, uint32(block.timestamp + 24 hours));
    }

    function test_locked_question_cannot_be_resubmitted_within_24h() public {
        _submit(alice, 7, false, keccak256("n7"), uint32(block.timestamp + 1 hours), signerKey);

        bytes memory sig = _signVerdict(
            signerKey, alice, 7, true, keccak256("n7-retry"), uint32(block.timestamp + 1 hours)
        );
        vm.prank(alice);
        vm.expectRevert(BaseQuiz.QuestionIsLocked.selector);
        quiz.submitAnswer(alice, 7, true, keccak256("n7-retry"), uint32(block.timestamp + 1 hours), sig);
    }

    function test_lockout_expires_after_24h() public {
        _submit(alice, 7, false, keccak256("n7"), uint32(block.timestamp + 1 hours), signerKey);
        // fast-forward 24 hours + 1s
        vm.warp(block.timestamp + 24 hours + 1);

        _submit(alice, 7, true, keccak256("n7-retry"), uint32(block.timestamp + 1 hours), signerKey);
        assertTrue(quiz.solved(alice, 7));
    }

    function test_replay_protection() public {
        bytes32 nonce    = keccak256("dupe");
        uint32  deadline = uint32(block.timestamp + 1 hours);

        bytes memory sig = _signVerdict(signerKey, alice, 1, true, nonce, deadline);
        vm.prank(alice);
        quiz.submitAnswer(alice, 1, true, nonce, deadline, sig);

        // attempt replay (different question even, same nonce)
        bytes memory sig2 = _signVerdict(signerKey, alice, 2, true, nonce, deadline);
        vm.prank(alice);
        vm.expectRevert(BaseQuiz.NonceAlreadyUsed.selector);
        quiz.submitAnswer(alice, 2, true, nonce, deadline, sig2);
    }

    function test_wrong_signer_rejected() public {
        uint256 evilKey = 0xDEAD;
        bytes memory sig = _signVerdict(evilKey, alice, 1, true, keccak256("n"), uint32(block.timestamp + 1 hours));
        vm.prank(alice);
        vm.expectRevert(BaseQuiz.InvalidSignature.selector);
        quiz.submitAnswer(alice, 1, true, keccak256("n"), uint32(block.timestamp + 1 hours), sig);
    }

    function test_expired_deadline_rejected() public {
        uint32 deadline = uint32(block.timestamp + 1 hours);
        bytes memory sig = _signVerdict(signerKey, alice, 1, true, keccak256("n"), deadline);

        vm.warp(deadline + 1);
        vm.prank(alice);
        vm.expectRevert(BaseQuiz.SignatureExpired.selector);
        quiz.submitAnswer(alice, 1, true, keccak256("n"), deadline, sig);
    }

    function test_wrong_user_in_verdict_rejected() public {
        bytes memory sig = _signVerdict(signerKey, alice, 1, true, keccak256("n"), uint32(block.timestamp + 1 hours));
        vm.prank(bob);
        vm.expectRevert(BaseQuiz.WrongUser.selector);
        quiz.submitAnswer(alice, 1, true, keccak256("n"), uint32(block.timestamp + 1 hours), sig);
    }

    function test_already_solved_question_rejected() public {
        _submit(alice, 1, true, keccak256("n1"), uint32(block.timestamp + 1 hours), signerKey);

        bytes memory sig = _signVerdict(signerKey, alice, 1, true, keccak256("n1-2"), uint32(block.timestamp + 1 hours));
        vm.prank(alice);
        vm.expectRevert(BaseQuiz.AlreadySolved.selector);
        quiz.submitAnswer(alice, 1, true, keccak256("n1-2"), uint32(block.timestamp + 1 hours), sig);
    }

    function test_owner_can_rotate_signer() public {
        uint256 newKey   = 0xBEEF;
        address newAddr  = vm.addr(newKey);

        vm.prank(owner);
        quiz.setTrustedSigner(newAddr);
        assertEq(quiz.trustedSigner(), newAddr);

        // new signer works
        bytes memory sig = _signVerdict(newKey, alice, 1, true, keccak256("n"), uint32(block.timestamp + 1 hours));
        vm.prank(alice);
        quiz.submitAnswer(alice, 1, true, keccak256("n"), uint32(block.timestamp + 1 hours), sig);

        // old signer rejected
        bytes memory sigOld = _signVerdict(signerKey, alice, 2, true, keccak256("n2"), uint32(block.timestamp + 1 hours));
        vm.prank(alice);
        vm.expectRevert(BaseQuiz.InvalidSignature.selector);
        quiz.submitAnswer(alice, 2, true, keccak256("n2"), uint32(block.timestamp + 1 hours), sigOld);
    }

    function test_non_owner_cannot_rotate_signer() public {
        vm.prank(alice);
        vm.expectRevert();
        quiz.setTrustedSigner(address(0xCAFE));
    }

    function test_level_caps_at_max_level() public {
        // 100 correct answers → 20 levels → cap
        for (uint16 i = 1; i <= 100; i++) {
            _submit(
                alice,
                i,
                true,
                keccak256(abi.encodePacked("MAX", i)),
                uint32(block.timestamp + 1 hours),
                signerKey
            );
        }
        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        assertEq(s.currentLevel, quiz.MAX_LEVEL());
        assertEq(eas.attestCount(), 20);
    }

    function test_isolated_users() public {
        // alice answers 5 correct → level 1
        for (uint16 i = 1; i <= 5; i++) {
            _submit(alice, i, true, keccak256(abi.encodePacked("a", i)), uint32(block.timestamp + 1 hours), signerKey);
        }
        // bob answers 1 wrong on q42
        _submit(bob, 42, false, keccak256("bw"), uint32(block.timestamp + 1 hours), signerKey);

        BaseQuiz.UserState memory a = quiz.getUserState(alice);
        BaseQuiz.UserState memory b = quiz.getUserState(bob);

        assertEq(a.currentLevel, 1);
        assertEq(b.currentLevel, 0);
        assertEq(b.currentStreak, 0);

        (bool aliceLocked,) = quiz.isLocked(alice, 42);
        (bool bobLocked,)   = quiz.isLocked(bob, 42);
        assertFalse(aliceLocked);
        assertTrue(bobLocked);
    }

    function test_event_emission_on_correct() public {
        bytes32 n = keccak256("ev-correct");
        bytes memory sig = _signVerdict(signerKey, alice, 1, true, n, uint32(block.timestamp + 1 hours));

        vm.expectEmit(true, true, false, true, address(quiz));
        emit BaseQuiz.AnswerSubmitted(alice, 1, true, 1);

        vm.prank(alice);
        quiz.submitAnswer(alice, 1, true, n, uint32(block.timestamp + 1 hours), sig);
    }

    function test_event_emission_on_wrong() public {
        bytes32 n = keccak256("ev-wrong");
        bytes memory sig = _signVerdict(signerKey, alice, 1, false, n, uint32(block.timestamp + 1 hours));

        vm.expectEmit(true, true, false, true, address(quiz));
        emit BaseQuiz.AnswerSubmitted(alice, 1, false, 0);

        vm.expectEmit(true, true, false, true, address(quiz));
        emit BaseQuiz.QuestionLocked(alice, 1, uint32(block.timestamp + 24 hours));

        vm.prank(alice);
        quiz.submitAnswer(alice, 1, false, n, uint32(block.timestamp + 1 hours), sig);
    }

    function testFuzz_random_streaks(uint8 correctCount) public {
        correctCount = uint8(bound(correctCount, 0, 100));
        for (uint16 i = 1; i <= correctCount; i++) {
            _submit(
                alice,
                i,
                true,
                keccak256(abi.encodePacked("fz", i)),
                uint32(block.timestamp + 1 hours),
                signerKey
            );
        }
        BaseQuiz.UserState memory s = quiz.getUserState(alice);
        uint8 expectedLevel = correctCount / 5;
        if (expectedLevel > quiz.MAX_LEVEL()) expectedLevel = quiz.MAX_LEVEL();

        assertEq(s.currentLevel, expectedLevel);
        assertEq(s.totalCorrect, correctCount);
    }
}
