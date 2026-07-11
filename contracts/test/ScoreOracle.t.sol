// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RitualMindBase} from "./Base.t.sol";
import {IWalletRegistry} from "../src/interfaces/IWalletRegistry.sol";
import {IProjectRegistry} from "../src/interfaces/IProjectRegistry.sol";
import {IActivityEmitter} from "../src/interfaces/IActivityEmitter.sol";
import {ScoreOracle} from "../src/ScoreOracle.sol";
import {Ownable} from "../src/base/Ownable.sol";

/// @notice Oracle suite. Authorization, batch bounds, badge minting at every
///         threshold, cluster flagging, and the precompile mocking pattern the agent
///         relies on off chain.
contract ScoreOracleTest is RitualMindBase {
    // --- Authorization ---

    function test_authorizeAgent_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(Ownable.NotOwner.selector);
        oracle.authorizeAgent(stranger, bytes32(0));
    }

    function test_submit_onlyAuthorizedAgent() public {
        vm.prank(stranger);
        vm.expectRevert(ScoreOracle.NotAuthorizedAgent.selector);
        oracle.submitUpdate(_input(alice, 1, 1, 1, 1));
    }

    function test_revokeAgent_blocksWrites() public {
        oracle.revokeAgent(agent);
        vm.prank(agent);
        vm.expectRevert(ScoreOracle.NotAuthorizedAgent.selector);
        oracle.submitUpdate(_input(alice, 1, 1, 1, 1));
    }

    function test_agentTeeKeyStored() public view {
        assertTrue(oracle.isAuthorizedAgent(agent));
        assertEq(oracle.agentTeeKey(agent), TEE_KEY);
    }

    // --- Batch ---

    function test_batchSubmit_updatesAll() public {
        IWalletRegistry.ScoreInput[] memory inputs = new IWalletRegistry.ScoreInput[](3);
        inputs[0] = _input(alice, 40, 0, 0, 0);
        inputs[1] = _input(bob, 30, 0, 0, 0);
        inputs[2] = _input(carol, 20, 0, 0, 0);
        vm.prank(agent);
        oracle.batchSubmit(inputs);
        // New wallet halving applies, so composites are half of raw, clamped by the floor.
        assertGt(registry.getProfile(alice).composite, 0);
        assertGt(registry.getProfile(bob).composite, 0);
        assertGt(registry.getProfile(carol).composite, 0);
    }

    function test_batchSubmit_emptyReverts() public {
        IWalletRegistry.ScoreInput[] memory inputs = new IWalletRegistry.ScoreInput[](0);
        vm.prank(agent);
        vm.expectRevert(ScoreOracle.EmptyBatch.selector);
        oracle.batchSubmit(inputs);
    }

    function test_batchSubmit_tooLargeReverts() public {
        IWalletRegistry.ScoreInput[] memory inputs = new IWalletRegistry.ScoreInput[](101);
        for (uint256 i = 0; i < 101; i++) {
            inputs[i] = _input(alice, 1, 0, 0, 0);
        }
        vm.prank(agent);
        vm.expectRevert(ScoreOracle.BatchTooLarge.selector);
        oracle.batchSubmit(inputs);
    }

    function test_batchProjectMetrics_updatesAll() public {
        address p1 = makeAddr("bp1");
        address p2 = makeAddr("bp2");
        vm.prank(alice);
        projects.register(p1, "One", "", IProjectRegistry.Category.DEFI, "", "");
        vm.prank(bob);
        projects.register(p2, "Two", "", IProjectRegistry.Category.GAMING, "", "");

        IProjectRegistry.MetricsInput[] memory inputs = new IProjectRegistry.MetricsInput[](2);
        inputs[0] = IProjectRegistry.MetricsInput(p1, 10, 100, 500, 100, 200, true);
        inputs[1] = IProjectRegistry.MetricsInput(p2, 20, 200, 600, 200, 300, true);
        vm.prank(agent);
        oracle.batchProjectMetrics(inputs);

        assertEq(projects.getProject(p1).healthScore, 500);
        assertEq(projects.getProject(p2).healthScore, 600);
    }

    // --- Cluster flagging ---

    function test_flagCluster_flagsEach() public {
        address[] memory cluster = new address[](2);
        cluster[0] = alice;
        cluster[1] = bob;
        vm.expectEmit(true, false, false, true, address(oracle));
        emit ClusterFlagged(7, 2, 3, ATT);
        vm.prank(agent);
        oracle.flagCluster(7, cluster, 3, "closed loop", ATT);
        assertEq(registry.getProfile(alice).flagSeverity, 3);
        assertEq(registry.getProfile(bob).flagSeverity, 3);
    }

    // --- Badges at threshold ---

    function test_badge_genesisBuilder() public {
        IWalletRegistry.ScoreInput memory inp = _input(alice, 30, 0, 0, 0);
        inp.contractsDeployed = 1;
        _submit(inp);
        assertTrue(badge.hasBadge(alice, GENESIS_BUILDER));
    }

    function test_badge_precompileBadges() public {
        IWalletRegistry.ScoreInput memory inp = _input(alice, 30, 0, 0, 0);
        inp.precompilesUsed = 3;
        _submit(inp);
        assertTrue(badge.hasBadge(alice, PRECOMPILE_PIONEER));
        assertFalse(badge.hasBadge(alice, ECOSYSTEM_ARCHITECT));

        inp.precompilesUsed = 5;
        _submit(inp);
        assertTrue(badge.hasBadge(alice, ECOSYSTEM_ARCHITECT));
    }

    function test_badge_ogRitualist() public {
        _submit(_input(alice, 10, 0, 0, 0));
        assertTrue(badge.hasBadge(alice, OG_RITUALIST));
    }

    function test_badge_multipleInOneSubmit() public {
        IWalletRegistry.ScoreInput memory inp = _input(alice, 30, 0, 0, 0);
        inp.contractsDeployed = 5;
        inp.precompilesUsed = 5;
        inp.attestationsGiven = 10;
        inp.weeklyStreak = 6;
        _submit(inp);
        assertTrue(badge.hasBadge(alice, GENESIS_BUILDER));
        assertTrue(badge.hasBadge(alice, PRECOMPILE_PIONEER));
        assertTrue(badge.hasBadge(alice, ECOSYSTEM_ARCHITECT));
        assertTrue(badge.hasBadge(alice, CONNECTOR));
        assertTrue(badge.hasBadge(alice, STREAK_MASTER));
        assertTrue(badge.hasBadge(alice, OG_RITUALIST));
        assertEq(badge.badgeCount(alice), 6);
    }

    function test_badge_trustedVoice() public {
        for (uint256 i = 0; i < 20; i++) {
            address w = address(uint160(uint256(0xA000) + i));
            vm.prank(w);
            registry.register();
            vm.prank(w);
            registry.attest(alice);
        }
        assertEq(registry.getProfile(alice).attestationsReceived, 20);
        _submit(_input(alice, 10, 0, 0, 0));
        assertTrue(badge.hasBadge(alice, TRUSTED_VOICE));
    }

    function test_badge_powerPoster() public {
        _agePastNewWalletWindow();
        _climbAdvocate(alice, 250);
        assertGe(registry.getProfile(alice).advocateScore, 250);
        assertTrue(badge.hasBadge(alice, POWER_POSTER));
    }

    function test_badge_eliteBuilder() public {
        _agePastNewWalletWindow();
        _climbBuilder(alice, 300);
        assertGe(registry.getProfile(alice).builderScore, 300);
        assertTrue(badge.hasBadge(alice, ELITE_BUILDER));
    }

    function test_badge_ritualLegend() public {
        _agePastNewWalletWindow();
        _climbComposite(alice, 800);
        assertGe(registry.getProfile(alice).composite, 800);
        assertTrue(badge.hasBadge(alice, RITUAL_LEGEND));
        assertTrue(badge.hasBadge(alice, ELITE_BUILDER));
    }

    // --- Feed passthroughs ---

    function test_recordAgentExecution_emits() public {
        bytes32 jobId = keccak256("cycle-1");
        vm.expectEmit(true, false, false, true, address(activity));
        emit AgentExecution(jobId, 42, ATT);
        vm.prank(agent);
        oracle.recordAgentExecution(jobId, 42, ATT);
    }

    function test_postDigest_emits() public {
        vm.expectEmit(true, false, false, true, address(activity));
        emit DigestPosted(20260710, "bafyDigestCid", ATT);
        vm.prank(agent);
        oracle.postDigest(20260710, "bafyDigestCid", ATT);
    }

    // --- Precompile mocking pattern (HTTP 0x0801, LLM 0x0802) ---

    function test_mockHttpPrecompile() public {
        PrecompileProbe probe = new PrecompileProbe();
        bytes memory actualOutput =
            abi.encode(uint16(200), new string[](0), new string[](0), bytes('{"ok":true}'), "");
        bytes memory raw = abi.encode(bytes(""), actualOutput);
        vm.mockCall(address(0x0801), bytes(""), raw);

        (uint16 status, bytes memory body) = probe.http(hex"deadbeef");
        assertEq(status, 200);
        assertEq(string(body), '{"ok":true}');
    }

    function test_mockLlmPrecompile() public {
        PrecompileProbe probe = new PrecompileProbe();
        PrecompileProbe.Convo memory convo = PrecompileProbe.Convo("", "", "");
        bytes memory actualOutput = abi.encode(false, bytes('{"score":8}'), bytes(""), "", convo);
        bytes memory raw = abi.encode(bytes(""), actualOutput);
        vm.mockCall(address(0x0802), bytes(""), raw);

        (bool hasError, bytes memory completion) = probe.llm(hex"1234");
        assertFalse(hasError);
        assertEq(string(completion), '{"score":8}');
    }
}

/// @notice Minimal consumer that exercises the HTTP and LLM precompiles the way the
///         agent does off chain. Used only to demonstrate the vm.mockCall pattern.
contract PrecompileProbe {
    address internal constant HTTP = 0x0000000000000000000000000000000000000801;
    address internal constant LLM = 0x0000000000000000000000000000000000000802;

    struct Convo {
        string platform;
        string path;
        string keyRef;
    }

    function http(bytes memory input) external returns (uint16 status, bytes memory body) {
        (bool ok, bytes memory raw) = HTTP.call(input);
        require(ok, "http failed");
        (, bytes memory out) = abi.decode(raw, (bytes, bytes));
        (status,,, body,) = abi.decode(out, (uint16, string[], string[], bytes, string));
    }

    function llm(bytes memory input) external returns (bool hasError, bytes memory completion) {
        (bool ok, bytes memory raw) = LLM.call(input);
        require(ok, "llm failed");
        (, bytes memory out) = abi.decode(raw, (bytes, bytes));
        Convo memory convo;
        bytes memory meta;
        string memory err;
        (hasError, completion, meta, err, convo) = abi.decode(out, (bool, bytes, bytes, string, Convo));
    }
}
