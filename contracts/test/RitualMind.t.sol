// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RitualMindBase} from "./Base.t.sol";
import {IWalletRegistry} from "../src/interfaces/IWalletRegistry.sol";
import {IProjectRegistry} from "../src/interfaces/IProjectRegistry.sol";
import {IActivityEmitter} from "../src/interfaces/IActivityEmitter.sol";
import {Ownable} from "../src/base/Ownable.sol";
import {WalletRegistry} from "../src/WalletRegistry.sol";
import {ActivityEmitter} from "../src/ActivityEmitter.sol";
import {ProjectRegistry} from "../src/ProjectRegistry.sol";
import {BadgeNFT} from "../src/BadgeNFT.sol";

/// @notice Core suite. Registration, Twitter linking, attestations, the anti gaming
///         rules, projects, badge soulbound behavior, access control, and events.
contract RitualMindTest is RitualMindBase {
    // --- Registration ---

    function test_register_assignsSequentialNumbers() public view {
        assertEq(registry.getProfile(alice).registrationNumber, 1);
        assertEq(registry.getProfile(bob).registrationNumber, 2);
        assertEq(registry.getProfile(carol).registrationNumber, 3);
        assertEq(registry.totalRegistered(), 3);
    }

    function test_register_revertsOnDouble() public {
        vm.prank(alice);
        vm.expectRevert(WalletRegistry.AlreadyRegistered.selector);
        registry.register();
    }

    // --- Twitter linking ---

    function test_linkTwitter_reservesHandleGlobally() public {
        vm.prank(alice);
        registry.linkTwitter("BuildOnRitual");
        assertEq(registry.getProfile(alice).twitterHandle, "BuildOnRitual");

        // Case insensitive global uniqueness. Bob cannot take the same handle.
        vm.prank(bob);
        vm.expectRevert(WalletRegistry.HandleTaken.selector);
        registry.linkTwitter("buildonritual");
    }

    function test_linkTwitter_revertsWhenAlreadyLinked() public {
        vm.startPrank(alice);
        registry.linkTwitter("first");
        vm.expectRevert(WalletRegistry.AlreadyLinked.selector);
        registry.linkTwitter("second");
        vm.stopPrank();
    }

    function test_linkTwitter_revertsForUnregistered() public {
        vm.prank(stranger);
        vm.expectRevert(WalletRegistry.NotRegistered.selector);
        registry.linkTwitter("stranger");
    }

    function test_confirmTwitter_onlyOracle() public {
        vm.prank(alice);
        registry.linkTwitter("alicehandle");
        assertFalse(registry.isTwitterVerified(alice));

        vm.prank(agent);
        oracle.confirmTwitter(alice);
        assertTrue(registry.isTwitterVerified(alice));
    }

    // --- Attestations ---

    function test_attest_recordsAndWeights() public {
        vm.prank(alice);
        registry.attest(bob);
        assertEq(registry.getProfile(bob).attestationsReceived, 1);
        assertEq(registry.attestationsGivenCount(alice), 1);
    }

    function test_attest_selfReverts() public {
        vm.prank(alice);
        vm.expectRevert(WalletRegistry.SelfAttestation.selector);
        registry.attest(alice);
    }

    function test_attest_cooldownEnforced() public {
        vm.prank(alice);
        registry.attest(bob);
        vm.prank(alice);
        vm.expectRevert(WalletRegistry.AttestCooldown.selector);
        registry.attest(bob);

        // After the cooldown it works again.
        vm.warp(block.timestamp + 7 days + 1);
        vm.prank(alice);
        registry.attest(bob);
        assertEq(registry.getProfile(bob).attestationsReceived, 2);
    }

    function test_attest_mutualEdgeRecorded() public {
        vm.prank(alice);
        registry.attest(bob);
        assertFalse(registry.mutualAttestation(alice, bob));

        vm.prank(bob);
        registry.attest(alice);
        assertTrue(registry.mutualAttestation(alice, bob));
        assertTrue(registry.mutualAttestation(bob, alice));
    }

    function test_attest_verifiedBuilderWeightsEight() public {
        // Give alice verified builder status through a score update.
        IWalletRegistry.ScoreInput memory inp = _input(alice, 100, 0, 0, 0);
        inp.isVerifiedBuilder = true;
        _submit(inp);

        vm.expectEmit(true, true, false, true, address(activity));
        emit AttestationGiven(alice, bob, 8);
        vm.prank(alice);
        registry.attest(bob);
    }

    // --- Score caps and invariant ---

    function test_updateScore_capsEachSubScore() public {
        _agePastNewWalletWindow();
        // Submit above every ceiling. The daily cap will also bite on the first write,
        // but caps and the invariant must always hold.
        IWalletRegistry.ScoreInput memory inp = _input(alice, 5000, 5000, 5000, 5000);
        _submit(inp);

        IWalletRegistry.WalletProfile memory p = registry.getProfile(alice);
        assertLe(p.builderScore, 400);
        assertLe(p.advocateScore, 300);
        assertLe(p.communityScore, 200);
        assertLe(p.userScore, 100);
        assertLe(p.composite, 1000);
        assertEq(p.composite, p.builderScore + p.advocateScore + p.communityScore + p.userScore);
    }

    function test_updateScore_newWalletHalfWeight() public {
        // Alice is brand new. Submit a modest score that is under the daily allowance so
        // the halving is the binding constraint, not the cap.
        // Daily floor allows +50, so use raw sub scores summing to <= ~50 after halving.
        IWalletRegistry.ScoreInput memory inp = _input(alice, 40, 20, 20, 10); // raw 90, halved 45
        _submit(inp);
        IWalletRegistry.WalletProfile memory p = registry.getProfile(alice);
        // Halved values: 20, 10, 10, 5 = 45, which is under the 50 floor so no scaling.
        assertEq(p.builderScore, 20);
        assertEq(p.advocateScore, 10);
        assertEq(p.communityScore, 10);
        assertEq(p.userScore, 5);
        assertEq(p.composite, 45);
    }

    function test_updateScore_dailyCapLimitsGrowth() public {
        _agePastNewWalletWindow();
        // First write establishes an anchor of zero, so growth is limited to the floor of 50.
        _submit(_input(alice, 400, 300, 200, 100));
        assertEq(registry.getProfile(alice).composite, 50);

        // Same day, another write cannot exceed the same anchor allowance.
        _submit(_input(alice, 400, 300, 200, 100));
        assertEq(registry.getProfile(alice).composite, 50);

        // Next day the anchor advances by fifteen percent or the floor, whichever is larger.
        vm.warp(block.timestamp + 1 days + 1);
        _submit(_input(alice, 400, 300, 200, 100));
        assertEq(registry.getProfile(alice).composite, 100);
    }

    function test_updateScore_decreasesApplyImmediately() public {
        _agePastNewWalletWindow();
        _climbComposite(alice, 400);
        assertGe(registry.getProfile(alice).composite, 400);

        // A penalty that drops the raw score applies with no delay.
        _submit(_input(alice, 10, 0, 0, 0));
        assertEq(registry.getProfile(alice).composite, 10);
    }

    function test_updateScore_compositeAlwaysEqualsSum() public {
        _agePastNewWalletWindow();
        _climbComposite(alice, 600);
        IWalletRegistry.WalletProfile memory p = registry.getProfile(alice);
        assertEq(p.composite, p.builderScore + p.advocateScore + p.communityScore + p.userScore);
    }

    // --- Freeze ---

    function test_flagWallet_freezeBlocksGrowth() public {
        _agePastNewWalletWindow();
        _climbComposite(alice, 200);
        uint16 before = registry.getProfile(alice).composite;

        vm.prank(agent);
        oracle.flagCluster(1, _one(alice), 3, "sybil cluster", ATT);
        assertEq(registry.getProfile(alice).flagSeverity, 3);

        // Frozen wallet cannot grow.
        vm.warp(block.timestamp + 2 days);
        _submit(_input(alice, 400, 300, 200, 100));
        assertEq(registry.getProfile(alice).composite, before);

        // But a decrease still applies.
        _submit(_input(alice, 5, 0, 0, 0));
        assertEq(registry.getProfile(alice).composite, 5);
    }

    // --- Score history ---

    function test_scoreHistory_isAppendOnly() public {
        _submit(_input(alice, 30, 0, 0, 0));
        _submit(_input(alice, 20, 0, 0, 0));
        IWalletRegistry.ScoreSnapshot[] memory h = registry.getScoreHistory(alice);
        assertEq(h.length, 2);
        assertEq(h[0].attestationHash, ATT);
    }

    // --- Top wallets ---

    function test_getTopWallets_ordersByComposite() public {
        _agePastNewWalletWindow();
        _climbComposite(alice, 300);
        _climbComposite(bob, 150);
        // carol stays at zero.

        (address[] memory top, uint16[] memory comps) = registry.getTopWallets(3);
        assertEq(top[0], alice);
        assertEq(top[1], bob);
        assertEq(top[2], carol);
        assertGe(comps[0], comps[1]);
        assertGe(comps[1], comps[2]);
    }

    // --- Projects ---

    function test_project_registerAndVerify() public {
        address proj = makeAddr("proj");
        vm.prank(alice);
        projects.register(proj, "Ritual DEX", "A dex on Ritual.", IProjectRegistry.Category.DEFI, "https://x", "https://gh");

        IProjectRegistry.Project memory p = projects.getProject(proj);
        assertEq(p.name, "Ritual DEX");
        assertEq(uint8(p.category), uint8(IProjectRegistry.Category.DEFI));
        assertTrue(p.isActive);
        assertFalse(p.isVerified);

        projects.verifyProject(proj);
        assertTrue(projects.getProject(proj).isVerified);
    }

    function test_project_updateMetricsOnlyThroughOracle() public {
        address proj = makeAddr("proj2");
        vm.prank(alice);
        projects.register(proj, "Agent Hub", "Agents.", IProjectRegistry.Category.AGENT, "", "");

        IProjectRegistry.MetricsInput memory m = IProjectRegistry.MetricsInput({
            contractAddress: proj,
            weeklyActiveWallets: 120,
            totalTxns: 5000,
            healthScore: 800,
            growthRate: 2500,
            communityScore: 400,
            isActive: true
        });
        vm.prank(agent);
        oracle.submitProjectMetrics(m);

        IProjectRegistry.Project memory p = projects.getProject(proj);
        assertEq(p.weeklyActiveWallets, 120);
        assertEq(p.healthScore, 800);
    }

    function test_project_getByCategoryAndTrending() public {
        address p1 = makeAddr("p1");
        address p2 = makeAddr("p2");
        vm.prank(alice);
        projects.register(p1, "DeFi One", "", IProjectRegistry.Category.DEFI, "", "");
        vm.prank(bob);
        projects.register(p2, "DeFi Two", "", IProjectRegistry.Category.DEFI, "", "");

        address[] memory defi = projects.getByCategory(IProjectRegistry.Category.DEFI);
        assertEq(defi.length, 2);

        // Give p2 stronger metrics so it trends first.
        IProjectRegistry.MetricsInput memory m = IProjectRegistry.MetricsInput(p2, 500, 9000, 900, 3000, 700, true);
        vm.prank(agent);
        oracle.submitProjectMetrics(m);

        (address[] memory trending,) = projects.getTrending(2);
        assertEq(trending[0], p2);
    }

    // --- Badge soulbound behavior ---

    function test_badge_mintOnlyByMinterAndIdempotent() public {
        // Direct mint from a non minter reverts.
        vm.prank(stranger);
        vm.expectRevert(BadgeNFT.NotMinter.selector);
        badge.mint(alice, GENESIS_BUILDER);

        // Oracle mints Genesis by submitting a score with a deployed contract. Alice is
        // registration number one, so she also earns OG Ritualist in the same submit.
        IWalletRegistry.ScoreInput memory inp = _input(alice, 30, 0, 0, 0);
        inp.contractsDeployed = 1;
        _submit(inp);
        assertTrue(badge.hasBadge(alice, GENESIS_BUILDER));
        assertTrue(badge.hasBadge(alice, OG_RITUALIST));
        uint256 countAfterFirst = badge.badgeCount(alice);
        assertEq(countAfterFirst, 2);
        uint64 earned = badge.earnedAt(alice, GENESIS_BUILDER);
        assertGt(earned, 0);

        // Resubmitting does not double mint. Count and timestamps are unchanged.
        _submit(inp);
        assertEq(badge.badgeCount(alice), countAfterFirst);
        assertEq(badge.earnedAt(alice, GENESIS_BUILDER), earned);
    }

    function test_badge_hasNoTransferSurface() public {
        // The BadgeNFT contract exposes no transferFrom selector. A raw call to the
        // canonical ERC721 transferFrom selector must fail because the function is absent.
        IWalletRegistry.ScoreInput memory inp = _input(alice, 30, 0, 0, 0);
        inp.contractsDeployed = 1;
        _submit(inp);

        bytes memory callData =
            abi.encodeWithSignature("transferFrom(address,address,uint256)", alice, bob, uint256(1));
        (bool ok,) = address(badge).call(callData);
        assertFalse(ok);
    }

    // --- Access control across the system ---

    function test_access_activityOnlyWriter() public {
        vm.prank(stranger);
        vm.expectRevert(ActivityEmitter.NotWriter.selector);
        activity.emitBadgeEarned(alice, 1);
    }

    function test_access_registryUpdateOnlyOracle() public {
        vm.prank(stranger);
        vm.expectRevert(WalletRegistry.NotOracle.selector);
        registry.updateScore(_input(alice, 1, 1, 1, 1));
    }

    function test_access_setOracleOnlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(Ownable.NotOwner.selector);
        registry.setOracle(stranger);
    }

    function test_access_projectUpdateOnlyUpdater() public {
        address proj = makeAddr("proj3");
        vm.prank(alice);
        projects.register(proj, "X", "", IProjectRegistry.Category.OTHER, "", "");
        IProjectRegistry.MetricsInput memory m = IProjectRegistry.MetricsInput(proj, 1, 1, 1, 0, 1, true);
        vm.prank(stranger);
        vm.expectRevert(ProjectRegistry.NotUpdater.selector);
        projects.updateMetrics(m);
    }

    // --- Events ---

    function test_event_registered() public {
        vm.expectEmit(true, false, false, true, address(registry));
        emit Registered(dave, 4);
        vm.prank(dave);
        registry.register();
    }

    function test_event_scoreUpdatedFeed() public {
        _agePastNewWalletWindow();
        vm.expectEmit(true, false, false, false, address(activity));
        emit ScoreUpdated(alice, 0, 0, ATT);
        _submit(_input(alice, 40, 0, 0, 0));
    }

    // --- Fuzz: caps and invariant never break ---

    function testFuzz_capsAndInvariant(uint16 b, uint16 a, uint16 c, uint16 u, bool aged) public {
        if (aged) _agePastNewWalletWindow();
        _submit(_input(alice, b, a, c, u));
        IWalletRegistry.WalletProfile memory p = registry.getProfile(alice);
        assertLe(p.builderScore, 400);
        assertLe(p.advocateScore, 300);
        assertLe(p.communityScore, 200);
        assertLe(p.userScore, 100);
        assertLe(p.composite, 1000);
        assertEq(p.composite, p.builderScore + p.advocateScore + p.communityScore + p.userScore);
    }

    function testFuzz_dailyCapNeverExceeded(uint16 b, uint16 a, uint16 c, uint16 u) public {
        _agePastNewWalletWindow();
        // Establish a known anchor.
        _submit(_input(alice, 400, 300, 200, 100)); // -> 50
        uint16 anchor = registry.getProfile(alice).composite;
        // Any same day write cannot push composite above anchor + max(15%, floor).
        _submit(_input(alice, b, a, c, u));
        uint16 after_ = registry.getProfile(alice).composite;
        uint256 allowance = uint256(anchor) + (uint256(anchor) * 1500 / 10000);
        if (allowance < uint256(anchor) + 50) allowance = uint256(anchor) + 50;
        assertLe(after_, allowance);
    }

    // --- BadgeNFT read surface ---

    function test_badge_tokenURIAndOwnerOf() public {
        IWalletRegistry.ScoreInput memory inp = _input(alice, 30, 0, 0, 0);
        inp.precompilesUsed = 5; // mints Precompile Pioneer and Ecosystem Architect
        _submit(inp);
        uint256 tokenId = (uint256(uint160(alice)) << 8) | uint256(PRECOMPILE_PIONEER);
        assertEq(badge.ownerOf(tokenId), alice);
        assertEq(badge.badgeIdOf(tokenId), PRECOMPILE_PIONEER);
        assertGt(bytes(badge.tokenURI(tokenId)).length, 40);
        assertEq(badge.badgeTitle(PRECOMPILE_PIONEER), "Precompile Pioneer");
    }

    function test_badge_supportsInterfaceAndReverts() public {
        assertTrue(badge.supportsInterface(0x01ffc9a7)); // ERC165
        assertFalse(badge.supportsInterface(0x80ac58cd)); // not ERC721
        vm.expectRevert(BadgeNFT.TokenDoesNotExist.selector);
        badge.ownerOf(123456);
        vm.expectRevert(BadgeNFT.InvalidBadge.selector);
        badge.badgeTitle(0);
        vm.expectRevert(BadgeNFT.InvalidBadge.selector);
        badge.badgeTitle(11);
    }

    function test_badge_setMinterOnlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(Ownable.NotOwner.selector);
        badge.setMinter(stranger, true);
    }

    function test_badge_invalidMintPathsRevert() public {
        badge.setMinter(address(this), true);
        vm.expectRevert(BadgeNFT.InvalidBadge.selector);
        badge.mint(alice, 0);
        vm.expectRevert(BadgeNFT.InvalidBadge.selector);
        badge.mint(alice, 11);
        vm.expectRevert(Ownable.ZeroAddress.selector);
        badge.mint(address(0), 1);
    }

    // --- Ownable two step transfer ---

    function test_ownable_twoStepTransfer() public {
        registry.transferOwnership(bob);
        assertEq(registry.owner(), deployer);
        assertEq(registry.pendingOwner(), bob);
        vm.prank(bob);
        registry.acceptOwnership();
        assertEq(registry.owner(), bob);
        assertEq(registry.pendingOwner(), address(0));
    }

    function test_ownable_acceptOnlyPending() public {
        registry.transferOwnership(bob);
        vm.prank(stranger);
        vm.expectRevert(Ownable.NotPendingOwner.selector);
        registry.acceptOwnership();
    }

    function test_ownable_transferOnlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(Ownable.NotOwner.selector);
        registry.transferOwnership(stranger);
    }

    // --- helpers ---

    function _one(address a0) internal pure returns (address[] memory arr) {
        arr = new address[](1);
        arr[0] = a0;
    }
}
