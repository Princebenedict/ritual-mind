// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ActivityEmitter} from "../src/ActivityEmitter.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";
import {WalletRegistry} from "../src/WalletRegistry.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {ScoreOracle} from "../src/ScoreOracle.sol";
import {IWalletRegistry} from "../src/interfaces/IWalletRegistry.sol";
import {IProjectRegistry} from "../src/interfaces/IProjectRegistry.sol";

/// @notice Shared deployment, wiring, and helpers for the Ritual Mind test suites.
abstract contract RitualMindBase is Test {
    ActivityEmitter internal activity;
    BadgeNFT internal badge;
    WalletRegistry internal registry;
    ProjectRegistry internal projects;
    ScoreOracle internal oracle;

    address internal deployer = address(this);
    address internal agent = makeAddr("agent");
    bytes32 internal constant TEE_KEY = keccak256("tee-key-1");
    bytes32 internal constant ATT = keccak256("attestation-hash");

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");
    address internal dave = makeAddr("dave");
    address internal stranger = makeAddr("stranger");

    // Event mirrors for expectEmit. Solidity 0.8.20 cannot reference an interface event
    // in an emit statement, so the exact signatures are redeclared here. The topic hash
    // matches the emitting contract by signature.
    event AttestationGiven(address indexed from, address indexed to, uint8 weight);
    event ScoreUpdated(address indexed wallet, uint256 composite, int256 delta, bytes32 attestationHash);
    event AgentExecution(bytes32 indexed jobId, uint256 walletsProcessed, bytes32 attestationHash);
    event DigestPosted(uint256 indexed dayIndex, string ipfsCid, bytes32 attestationHash);
    event Registered(address indexed wallet, uint32 registrationNumber);
    event ClusterFlagged(uint256 indexed clusterId, uint256 size, uint8 severity, bytes32 attestationHash);

    // Badge ids aligned with BadgeNFT.
    uint8 internal constant GENESIS_BUILDER = 1;
    uint8 internal constant PRECOMPILE_PIONEER = 2;
    uint8 internal constant ECOSYSTEM_ARCHITECT = 3;
    uint8 internal constant POWER_POSTER = 4;
    uint8 internal constant OG_RITUALIST = 5;
    uint8 internal constant CONNECTOR = 6;
    uint8 internal constant TRUSTED_VOICE = 7;
    uint8 internal constant STREAK_MASTER = 8;
    uint8 internal constant ELITE_BUILDER = 9;
    uint8 internal constant RITUAL_LEGEND = 10;

    function setUp() public virtual {
        // The test contract is the deployer and owner.
        activity = new ActivityEmitter(deployer);
        badge = new BadgeNFT(deployer);
        registry = new WalletRegistry(deployer, address(activity));
        projects = new ProjectRegistry(deployer, address(activity));
        oracle = new ScoreOracle(deployer, address(registry), address(projects), address(badge), address(activity));

        activity.setWriter(address(registry), true);
        activity.setWriter(address(projects), true);
        activity.setWriter(address(oracle), true);
        registry.setOracle(address(oracle));
        badge.setMinter(address(oracle), true);
        projects.setUpdater(address(oracle), true);
        oracle.authorizeAgent(agent, TEE_KEY);

        vm.prank(alice);
        registry.register();
        vm.prank(bob);
        registry.register();
        vm.prank(carol);
        registry.register();
    }

    // --- Helpers ---

    function _input(address w, uint16 b, uint16 a, uint16 c, uint16 u)
        internal
        pure
        returns (IWalletRegistry.ScoreInput memory)
    {
        return IWalletRegistry.ScoreInput({
            wallet: w,
            builderScore: b,
            advocateScore: a,
            communityScore: c,
            userScore: u,
            weeklyStreak: 0,
            contractsDeployed: 0,
            precompilesUsed: 0,
            attestationsGiven: 0,
            isVerifiedBuilder: false,
            attestationHash: ATT
        });
    }

    function _submit(IWalletRegistry.ScoreInput memory inp) internal {
        vm.prank(agent);
        oracle.submitUpdate(inp);
    }

    /// @notice Age a wallet past the new wallet window so scores count at full weight.
    function _agePastNewWalletWindow() internal {
        vm.warp(block.timestamp + 8 days);
    }

    /// @notice Climb a single sub score to at least target by submitting daily, letting
    ///         the rolling daily cap advance. Requires the wallet to be aged already.
    function _climbBuilder(address w, uint16 target) internal {
        for (uint256 i = 0; i < 80 && registry.getProfile(w).builderScore < target; i++) {
            vm.warp(block.timestamp + 1 days + 1);
            _submit(_input(w, 400, 0, 0, 0));
        }
    }

    function _climbAdvocate(address w, uint16 target) internal {
        for (uint256 i = 0; i < 80 && registry.getProfile(w).advocateScore < target; i++) {
            vm.warp(block.timestamp + 1 days + 1);
            _submit(_input(w, 0, 300, 0, 0));
        }
    }

    function _climbComposite(address w, uint16 target) internal {
        for (uint256 i = 0; i < 80 && registry.getProfile(w).composite < target; i++) {
            vm.warp(block.timestamp + 1 days + 1);
            _submit(_input(w, 400, 300, 200, 100));
        }
    }
}
