// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {ActivityEmitter} from "../src/ActivityEmitter.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";
import {WalletRegistry} from "../src/WalletRegistry.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {ScoreOracle} from "../src/ScoreOracle.sol";

/// @title Deploy
/// @notice Deploys the five Ritual Mind contracts in dependency order and wires every
///         permission so the system is live in a single broadcast. The deployer is
///         derived from the PRIVATE_KEY environment variable and is never hardcoded.
///         If AGENT_ADDRESS is provided, the agent is authorized on the oracle in the
///         same run. Otherwise authorize the agent later with a follow up transaction.
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address agent = vm.envOr("AGENT_ADDRESS", address(0));
        bytes32 teeKey = vm.envOr("AGENT_TEE_KEY", bytes32(0));

        console2.log("Deployer:", deployer);
        console2.log("Deployer balance (wei):", deployer.balance);

        vm.startBroadcast(pk);

        // Deploy in dependency order.
        ActivityEmitter activity = new ActivityEmitter(deployer);
        BadgeNFT badge = new BadgeNFT(deployer);
        WalletRegistry registry = new WalletRegistry(deployer, address(activity));
        ProjectRegistry projects = new ProjectRegistry(deployer, address(activity));
        ScoreOracle oracle =
            new ScoreOracle(deployer, address(registry), address(projects), address(badge), address(activity));

        // Wire permissions. The oracle is the sole score writer and badge minter.
        activity.setWriter(address(registry), true);
        activity.setWriter(address(projects), true);
        activity.setWriter(address(oracle), true);
        registry.setOracle(address(oracle));
        badge.setMinter(address(oracle), true);
        projects.setUpdater(address(oracle), true);

        // Optionally authorize the agent now.
        if (agent != address(0)) {
            oracle.authorizeAgent(agent, teeKey);
        }

        vm.stopBroadcast();

        console2.log("--- Ritual Mind deployment ---");
        console2.log("ActivityEmitter:", address(activity));
        console2.log("BadgeNFT:       ", address(badge));
        console2.log("WalletRegistry: ", address(registry));
        console2.log("ProjectRegistry:", address(projects));
        console2.log("ScoreOracle:    ", address(oracle));
        if (agent != address(0)) {
            console2.log("Agent authorized:", agent);
        } else {
            console2.log("Agent not set. Authorize later with oracle.authorizeAgent(agent, teeKey).");
        }
        console2.log("Copy these into agent/.env and frontend/.env.local.");
    }
}
