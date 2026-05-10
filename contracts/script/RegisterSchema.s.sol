// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ISchemaRegistry} from "../lib/ISchemaRegistry.sol";

/// @notice One-time registration of the BaseQuiz level schema on Base Mainnet.
///
/// Run before deploying BaseQuiz. Save the printed schema UID into LEVEL_SCHEMA_UID
/// in your .env, then run Deploy.s.sol.
///
/// Required env:
///   PRIVATE_KEY  — deployer EOA
///
/// Run:
///   forge script script/RegisterSchema.s.sol:RegisterSchemaScript \
///     --rpc-url base \
///     --broadcast
contract RegisterSchemaScript is Script {
    // Base Mainnet SchemaRegistry predeploy (see docs.attest.org → Quick Start → Contracts)
    address constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;

    string  constant SCHEMA   = "uint8 level,uint32 totalCorrect,uint64 timestamp,uint16 quizVersion";
    address constant RESOLVER = address(0);
    bool    constant REVOCABLE = false;

    function run() external returns (bytes32 uid) {
        uint256 key = vm.envUint("PRIVATE_KEY");

        console2.log("Registering schema on SchemaRegistry:", SCHEMA_REGISTRY);
        console2.log("Schema string:", SCHEMA);
        console2.log("Resolver:    ", RESOLVER);
        console2.log("Revocable:   ", REVOCABLE);

        vm.startBroadcast(key);
        uid = ISchemaRegistry(SCHEMA_REGISTRY).register(SCHEMA, RESOLVER, REVOCABLE);
        vm.stopBroadcast();

        console2.log("");
        console2.log("Schema registered. UID:");
        console2.logBytes32(uid);
        console2.log("");
        console2.log("Set LEVEL_SCHEMA_UID in .env before running Deploy.s.sol.");
    }
}
