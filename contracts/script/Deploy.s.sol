// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BaseQuiz} from "../src/BaseQuiz.sol";
import {IEAS} from "../lib/IEAS.sol";

/// @notice Deployment script for BaseQuiz on Base Mainnet (chainId 8453).
///
/// Required env vars:
///   PRIVATE_KEY            — deployer EOA private key
///   TRUSTED_SIGNER         — address that will sign AnswerVerdict (backend hot wallet)
///   EAS_ADDRESS            — EAS contract on Base (verify at docs.attest.org/docs/quick--start/contracts)
///   LEVEL_SCHEMA_UID       — pre-registered schema UID for level attestations
///   OWNER                  — owner address (multisig recommended)
///
/// Run:
///   forge script script/Deploy.s.sol:DeployScript \
///     --rpc-url base \
///     --broadcast \
///     --verify
contract DeployScript is Script {
    function run() external returns (BaseQuiz quiz) {
        uint256 deployerKey  = vm.envUint("PRIVATE_KEY");
        address trustedSigner = vm.envAddress("TRUSTED_SIGNER");
        address easAddress    = vm.envAddress("EAS_ADDRESS");
        bytes32 schemaUID     = vm.envBytes32("LEVEL_SCHEMA_UID");
        address owner         = vm.envAddress("OWNER");

        console2.log("Deployer:        ", vm.addr(deployerKey));
        console2.log("Trusted signer:  ", trustedSigner);
        console2.log("EAS contract:    ", easAddress);
        console2.log("Schema UID:      ");
        console2.logBytes32(schemaUID);
        console2.log("Contract owner:  ", owner);

        vm.startBroadcast(deployerKey);
        quiz = new BaseQuiz(trustedSigner, IEAS(easAddress), schemaUID, owner);
        vm.stopBroadcast();

        console2.log("BaseQuiz deployed at:", address(quiz));
    }
}
