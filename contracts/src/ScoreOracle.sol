// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "./base/Ownable.sol";
import {IScoreOracle} from "./interfaces/IScoreOracle.sol";
import {IWalletRegistry} from "./interfaces/IWalletRegistry.sol";
import {IProjectRegistry} from "./interfaces/IProjectRegistry.sol";
import {IBadgeNFT} from "./interfaces/IBadgeNFT.sol";
import {IActivityEmitter} from "./interfaces/IActivityEmitter.sol";

/// @title ScoreOracle
/// @notice The TEE trust anchor. Only agents that the owner has authorized, and that
///         run inside a verified enclave, can write scores, flag Sybil clusters,
///         update project metrics, or post digests. The oracle is the sole writer to
///         the WalletRegistry and the sole minter of badges, so the entire scored
///         surface derives from attested enclave output.
///
///         Every payload carries a TEE attestation hash. On chain verification of the
///         raw attestation is out of scope for a testnet reference, so trust is rooted
///         in owner authorization of the enclave agent address plus the recorded
///         attestation hash per write. The badge thresholds and anti gaming rules are
///         enforced by the registry and by this oracle, not by the agent.
contract ScoreOracle is Ownable, IScoreOracle {
    uint256 public constant MAX_BATCH = 100;

    // Badge ids, aligned with BadgeNFT.
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

    // Badge thresholds. Power Poster is set to 250. The product brief listed 500, but
    // the advocate sub score is capped at 300, so 250 is the near maximum band that is
    // actually reachable. This is the single deliberate deviation, documented here.
    uint16 internal constant POWER_POSTER_MIN = 250;
    uint8 internal constant PRECOMPILE_PIONEER_MIN = 3;
    uint8 internal constant ECOSYSTEM_ARCHITECT_MIN = 5;
    uint32 internal constant OG_RITUALIST_MAX_REGNUM = 100;
    uint16 internal constant CONNECTOR_MIN = 10;
    uint32 internal constant TRUSTED_VOICE_MIN = 20;
    uint16 internal constant STREAK_MASTER_MIN = 6;
    uint16 internal constant ELITE_BUILDER_MIN = 300;
    uint16 internal constant RITUAL_LEGEND_MIN = 800;

    IWalletRegistry public immutable registry;
    IProjectRegistry public immutable projectRegistry;
    IBadgeNFT public immutable badge;
    IActivityEmitter public immutable activity;

    mapping(address => bool) public isAuthorizedAgent;
    mapping(address => bytes32) public agentTeeKey;

    error NotAuthorizedAgent();
    error BatchTooLarge();
    error EmptyBatch();

    modifier onlyAgent() {
        if (!isAuthorizedAgent[msg.sender]) revert NotAuthorizedAgent();
        _;
    }

    constructor(
        address initialOwner,
        address walletRegistry,
        address projects,
        address badgeNFT,
        address activityEmitter
    ) Ownable(initialOwner) {
        if (
            walletRegistry == address(0) || projects == address(0) || badgeNFT == address(0)
                || activityEmitter == address(0)
        ) revert ZeroAddress();
        registry = IWalletRegistry(walletRegistry);
        projectRegistry = IProjectRegistry(projects);
        badge = IBadgeNFT(badgeNFT);
        activity = IActivityEmitter(activityEmitter);
    }

    // --- Owner: agent authorization ---

    function authorizeAgent(address agent, bytes32 teeKey) external onlyOwner {
        if (agent == address(0)) revert ZeroAddress();
        isAuthorizedAgent[agent] = true;
        agentTeeKey[agent] = teeKey;
        emit AgentAuthorized(agent, teeKey);
    }

    function revokeAgent(address agent) external onlyOwner {
        isAuthorizedAgent[agent] = false;
        agentTeeKey[agent] = bytes32(0);
        emit AgentRevoked(agent);
    }

    // --- Agent: score writes ---

    function submitUpdate(IWalletRegistry.ScoreInput calldata input) external onlyAgent {
        _process(input);
    }

    function batchSubmit(IWalletRegistry.ScoreInput[] calldata inputs) external onlyAgent {
        uint256 len = inputs.length;
        if (len == 0) revert EmptyBatch();
        if (len > MAX_BATCH) revert BatchTooLarge();
        for (uint256 i = 0; i < len; i++) {
            _process(inputs[i]);
        }
    }

    // --- Agent: anti gaming ---

    function flagCluster(
        uint256 clusterId,
        address[] calldata wallets,
        uint8 severity,
        string calldata reason,
        bytes32 attestationHash
    ) external onlyAgent {
        uint256 len = wallets.length;
        if (len == 0) revert EmptyBatch();
        if (len > MAX_BATCH) revert BatchTooLarge();
        for (uint256 i = 0; i < len; i++) {
            registry.flagWallet(wallets[i], severity, reason);
        }
        emit ClusterFlagged(clusterId, len, severity, attestationHash);
    }

    // --- Agent: project metrics ---

    function submitProjectMetrics(IProjectRegistry.MetricsInput calldata input) external onlyAgent {
        projectRegistry.updateMetrics(input);
    }

    function batchProjectMetrics(IProjectRegistry.MetricsInput[] calldata inputs) external onlyAgent {
        uint256 len = inputs.length;
        if (len == 0) revert EmptyBatch();
        if (len > MAX_BATCH) revert BatchTooLarge();
        for (uint256 i = 0; i < len; i++) {
            projectRegistry.updateMetrics(inputs[i]);
        }
    }

    // --- Agent: feed and lifecycle ---

    function recordAgentExecution(bytes32 jobId, uint256 walletsProcessed, bytes32 attestationHash)
        external
        onlyAgent
    {
        activity.emitAgentExecution(jobId, walletsProcessed, attestationHash);
    }

    function postDigest(uint256 dayIndex, string calldata ipfsCid, bytes32 attestationHash) external onlyAgent {
        activity.emitDigestPosted(dayIndex, ipfsCid, attestationHash);
    }

    function confirmTwitter(address wallet) external onlyAgent {
        registry.confirmTwitterVerification(wallet);
    }

    function noteContractDeployed(address deployer, address contractAddress) external onlyAgent {
        activity.emitContractDeployed(deployer, contractAddress);
    }

    function noteSocialMilestone(address wallet, string calldata kind, uint256 value) external onlyAgent {
        activity.emitSocialMilestone(wallet, kind, value);
    }

    // --- Internal ---

    function _process(IWalletRegistry.ScoreInput calldata input) private {
        registry.updateScore(input);
        IWalletRegistry.WalletProfile memory p = registry.getProfile(input.wallet);
        _checkBadges(input, p);
    }

    function _checkBadges(IWalletRegistry.ScoreInput calldata input, IWalletRegistry.WalletProfile memory p) private {
        address w = input.wallet;
        _tryBadge(w, GENESIS_BUILDER, input.contractsDeployed >= 1);
        _tryBadge(w, PRECOMPILE_PIONEER, input.precompilesUsed >= PRECOMPILE_PIONEER_MIN);
        _tryBadge(w, ECOSYSTEM_ARCHITECT, input.precompilesUsed >= ECOSYSTEM_ARCHITECT_MIN);
        _tryBadge(w, POWER_POSTER, p.advocateScore >= POWER_POSTER_MIN);
        _tryBadge(w, OG_RITUALIST, p.registrationNumber != 0 && p.registrationNumber <= OG_RITUALIST_MAX_REGNUM);
        _tryBadge(w, CONNECTOR, input.attestationsGiven >= CONNECTOR_MIN);
        _tryBadge(w, TRUSTED_VOICE, p.attestationsReceived >= TRUSTED_VOICE_MIN);
        _tryBadge(w, STREAK_MASTER, p.weeklyStreak >= STREAK_MASTER_MIN);
        _tryBadge(w, ELITE_BUILDER, p.builderScore >= ELITE_BUILDER_MIN);
        _tryBadge(w, RITUAL_LEGEND, p.composite >= RITUAL_LEGEND_MIN);
    }

    function _tryBadge(address wallet, uint8 badgeId, bool condition) private {
        if (!condition) return;
        if (badge.mint(wallet, badgeId)) {
            activity.emitBadgeEarned(wallet, badgeId);
        }
    }
}
