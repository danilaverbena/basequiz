// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal EAS interface used by BaseQuiz. The full interface lives in the
// ethereum-attestation-service/eas-contracts package; we vendor only what
// we need to keep the project free of npm complexity for vibe-coding.
struct AttestationRequestData {
    address recipient;
    uint64  expirationTime;
    bool    revocable;
    bytes32 refUID;
    bytes   data;
    uint256 value;
}

struct AttestationRequest {
    bytes32 schema;
    AttestationRequestData data;
}

interface IEAS {
    function attest(AttestationRequest calldata request) external payable returns (bytes32);
}
