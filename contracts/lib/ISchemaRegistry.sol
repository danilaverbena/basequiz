// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Minimal SchemaRegistry interface for registering quiz-level schemas on EAS.
// Full interface lives in the ethereum-attestation-service/eas-contracts package.
interface ISchemaResolver {} // marker type for resolver address

interface ISchemaRegistry {
    /// @notice Registers a new schema.
    /// @param schema     ABI-style field list, e.g. "uint8 level,uint32 totalCorrect,uint64 timestamp,uint16 quizVersion"
    /// @param resolver   Optional resolver contract (use address(0) for none).
    /// @param revocable  Whether attestations under this schema are revocable.
    /// @return uid       The schema UID (keccak256 of canonicalised params).
    function register(string calldata schema, address resolver, bool revocable) external returns (bytes32 uid);

    struct SchemaRecord {
        bytes32 uid;
        address resolver;
        bool revocable;
        string schema;
    }

    function getSchema(bytes32 uid) external view returns (SchemaRecord memory);
}
