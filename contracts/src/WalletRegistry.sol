// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "./base/Ownable.sol";
import {IWalletRegistry} from "./interfaces/IWalletRegistry.sol";
import {IActivityEmitter} from "./interfaces/IActivityEmitter.sol";

/// @title WalletRegistry
/// @notice The scored identity registry and the on chain enforcement point for the
///         anti gaming rules. Scores are written only by the oracle. Every rule that
///         can be expressed on chain is enforced here rather than trusted to the
///         off chain agent.
///
/// Enforced invariants:
///  - composite always equals builderScore + advocateScore + communityScore + userScore.
///  - each sub score is capped to its maximum.
///  - wallets younger than seven days have their scores counted at half weight.
///  - composite may not grow by more than fifteen percent within any rolling day,
///    with a small absolute floor so new wallets can bootstrap.
///  - frozen wallets cannot increase their composite.
///  - a Twitter handle can be linked to exactly one wallet globally.
///  - a wallet cannot attest itself, and cannot re attest the same wallet within the
///    seven day cooldown. Mutual attestation edges are recorded for ring detection.
///  - score history is append only and never mutated.
contract WalletRegistry is Ownable, IWalletRegistry {
    // --- Score ceilings ---
    uint16 internal constant BUILDER_MAX = 400;
    uint16 internal constant ADVOCATE_MAX = 300;
    uint16 internal constant COMMUNITY_MAX = 200;
    uint16 internal constant USER_MAX = 100;
    uint16 internal constant COMPOSITE_MAX = 1000;

    // --- Anti gaming parameters ---
    uint256 internal constant NEW_WALLET_WINDOW = 7 days;
    uint256 internal constant DAILY_CAP_BPS = 1500; // fifteen percent
    uint256 internal constant MIN_DAILY_GROWTH = 50; // absolute floor so a new wallet can start
    uint256 internal constant ATTEST_COOLDOWN = 7 days;
    uint8 internal constant SEVERITY_FROZEN = 3;

    struct DailyAnchor {
        uint16 anchorComposite;
        uint64 anchorTime;
    }

    // Working values held in memory during a score update to limit stack depth.
    struct Work {
        uint16 oldComposite;
        uint16 oldBuilder;
        uint16 oldAdvocate;
        uint16 oldCommunity;
        uint16 oldUser;
        uint16 builder;
        uint16 advocate;
        uint16 community;
        uint16 user;
    }

    IActivityEmitter public immutable activity;
    address public oracle;

    mapping(address => bool) public isRegistered;
    mapping(address => WalletProfile) internal profiles;
    mapping(address => ScoreSnapshot[]) internal history;
    mapping(address => bool) public isTwitterVerified;
    mapping(bytes32 => address) public handleOwner; // keccak(lowercased handle) => wallet
    mapping(address => DailyAnchor) internal dailyAnchor;

    mapping(address => mapping(address => uint64)) public attestedAt; // from => to => timestamp
    mapping(address => mapping(address => bool)) public mutualAttestation;
    mapping(address => uint32) public attestationsGivenCount;

    address[] internal allWallets;
    uint256 public registrationCount;

    error NotOracle();
    error NotRegistered();
    error TargetNotRegistered();
    error AlreadyRegistered();
    error InvalidHandle();
    error AlreadyLinked();
    error HandleTaken();
    error NotLinked();
    error SelfAttestation();
    error AttestCooldown();
    error InvalidSeverity();

    modifier onlyOracle() {
        if (msg.sender != oracle) revert NotOracle();
        _;
    }

    constructor(address initialOwner, address activityEmitter) Ownable(initialOwner) {
        if (activityEmitter == address(0)) revert ZeroAddress();
        activity = IActivityEmitter(activityEmitter);
    }

    // --- Owner wiring ---

    function setOracle(address oracle_) external onlyOwner {
        if (oracle_ == address(0)) revert ZeroAddress();
        oracle = oracle_;
        emit OracleUpdated(oracle_);
    }

    // --- User actions ---

    /// @notice Register the caller as a scored wallet. Assigns a permanent
    ///         registration number used for the OG Ritualist badge.
    function register() external {
        if (isRegistered[msg.sender]) revert AlreadyRegistered();
        isRegistered[msg.sender] = true;
        registrationCount += 1;
        uint32 regNum = uint32(registrationCount);

        WalletProfile storage p = profiles[msg.sender];
        p.wallet = msg.sender;
        p.registeredAt = uint64(block.timestamp);
        p.lastUpdated = uint64(block.timestamp);
        p.registrationNumber = regNum;

        allWallets.push(msg.sender);
        emit Registered(msg.sender, regNum);
    }

    /// @notice Claim a Twitter handle for the caller. The handle is reserved globally
    ///         and can never be claimed by another wallet. Verification of ownership is
    ///         confirmed later by the agent through confirmTwitterVerification.
    function linkTwitter(string calldata handle) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        uint256 len = bytes(handle).length;
        if (len == 0 || len > 32) revert InvalidHandle();
        if (bytes(profiles[msg.sender].twitterHandle).length != 0) revert AlreadyLinked();

        bytes32 key = keccak256(bytes(_toLower(handle)));
        if (handleOwner[key] != address(0)) revert HandleTaken();

        handleOwner[key] = msg.sender;
        profiles[msg.sender].twitterHandle = handle;
        emit TwitterLinked(msg.sender, handle);
    }

    /// @notice Vouch for another wallet. Self attestation reverts. Re attesting the
    ///         same wallet within the cooldown reverts. Mutual edges are recorded so
    ///         the agent can penalize attestation rings off chain.
    function attest(address to) external {
        if (!isRegistered[msg.sender]) revert NotRegistered();
        if (!isRegistered[to]) revert TargetNotRegistered();
        if (to == msg.sender) revert SelfAttestation();

        uint64 last = attestedAt[msg.sender][to];
        if (last != 0 && block.timestamp - last < ATTEST_COOLDOWN) revert AttestCooldown();

        attestedAt[msg.sender][to] = uint64(block.timestamp);
        attestationsGivenCount[msg.sender] += 1;
        profiles[to].attestationsReceived += 1;

        bool mutualEdge = attestedAt[to][msg.sender] != 0;
        if (mutualEdge) {
            mutualAttestation[msg.sender][to] = true;
            mutualAttestation[to][msg.sender] = true;
        }

        uint8 weight = profiles[msg.sender].isVerifiedBuilder ? uint8(8) : uint8(3);
        emit Attested(msg.sender, to, weight, mutualEdge);
        activity.emitAttestationGiven(msg.sender, to, weight);
    }

    // --- Oracle actions ---

    /// @notice Write a fresh score for a wallet, applying every on chain anti gaming
    ///         rule. Returns the stored composite after all rules are applied.
    function updateScore(ScoreInput calldata input) external onlyOracle returns (uint16 newComposite) {
        if (!isRegistered[input.wallet]) revert NotRegistered();
        WalletProfile storage p = profiles[input.wallet];

        Work memory w;
        w.oldComposite = p.composite;
        w.oldBuilder = p.builderScore;
        w.oldAdvocate = p.advocateScore;
        w.oldCommunity = p.communityScore;
        w.oldUser = p.userScore;

        // 1. Cap each sub score to its ceiling.
        w.builder = input.builderScore > BUILDER_MAX ? BUILDER_MAX : input.builderScore;
        w.advocate = input.advocateScore > ADVOCATE_MAX ? ADVOCATE_MAX : input.advocateScore;
        w.community = input.communityScore > COMMUNITY_MAX ? COMMUNITY_MAX : input.communityScore;
        w.user = input.userScore > USER_MAX ? USER_MAX : input.userScore;

        // 2. New wallet multiplier. First seven days count at half weight.
        if (block.timestamp - p.registeredAt < NEW_WALLET_WINDOW) {
            w.builder /= 2;
            w.advocate /= 2;
            w.community /= 2;
            w.user /= 2;
        }

        uint16 rawComposite = w.builder + w.advocate + w.community + w.user;

        // 3. Target composite under the freeze rule and the rolling daily cap.
        uint16 target = _targetComposite(input.wallet, w.oldComposite, rawComposite, p.flagSeverity);

        // 4. Scale sub scores down proportionally so the invariant holds exactly.
        if (target < rawComposite && rawComposite > 0) {
            w.builder = uint16((uint256(w.builder) * target) / rawComposite);
            w.advocate = uint16((uint256(w.advocate) * target) / rawComposite);
            w.community = uint16((uint256(w.community) * target) / rawComposite);
            w.user = uint16((uint256(w.user) * target) / rawComposite);
        }
        newComposite = w.builder + w.advocate + w.community + w.user;

        // 5. Persist.
        p.builderScore = w.builder;
        p.advocateScore = w.advocate;
        p.communityScore = w.community;
        p.userScore = w.user;
        p.composite = newComposite;
        p.weeklyStreak = input.weeklyStreak;
        p.isVerifiedBuilder = input.isVerifiedBuilder;
        p.lastUpdated = uint64(block.timestamp);

        // 6. Append immutable history.
        history[input.wallet].push(
            ScoreSnapshot({
                composite: newComposite,
                builderScore: w.builder,
                advocateScore: w.advocate,
                communityScore: w.community,
                userScore: w.user,
                timestamp: uint64(block.timestamp),
                attestationHash: input.attestationHash
            })
        );

        // 7. Emit the detailed local event and the compact feed event.
        _emitScoreUpdated(input.wallet, w, newComposite, input.attestationHash);
    }

    /// @notice Flag a wallet at a severity level. Severity three freezes the wallet so
    ///         its composite can no longer increase. The record is permanent on chain.
    function flagWallet(address wallet, uint8 severity, string calldata reason) external onlyOracle {
        if (!isRegistered[wallet]) revert NotRegistered();
        if (severity > SEVERITY_FROZEN) revert InvalidSeverity();
        profiles[wallet].flagSeverity = severity;
        emit WalletFlagged(wallet, severity, reason);
        activity.emitWalletFlagged(wallet, severity, reason);
    }

    /// @notice Store the global rank computed off chain by the agent.
    function setRank(address wallet, uint32 rank) external onlyOracle {
        profiles[wallet].globalRank = rank;
        emit RankUpdated(wallet, rank);
    }

    /// @notice Mark a linked handle as verified after the agent detects the proof post.
    function confirmTwitterVerification(address wallet) external onlyOracle {
        if (bytes(profiles[wallet].twitterHandle).length == 0) revert NotLinked();
        isTwitterVerified[wallet] = true;
        emit TwitterVerified(wallet, profiles[wallet].twitterHandle);
    }

    // --- Views ---

    function getProfile(address wallet) external view returns (WalletProfile memory) {
        return profiles[wallet];
    }

    function getScoreHistory(address wallet) external view returns (ScoreSnapshot[] memory) {
        return history[wallet];
    }

    function registrationNumber(address wallet) external view returns (uint32) {
        return profiles[wallet].registrationNumber;
    }

    function totalRegistered() external view returns (uint256) {
        return allWallets.length;
    }

    /// @notice Return the top wallets by composite. This is a view intended for off
    ///         chain reads. It runs a bounded selection over all registered wallets.
    function getTopWallets(uint256 count)
        external
        view
        returns (address[] memory wallets, uint16[] memory composites)
    {
        uint256 total = allWallets.length;
        uint256 n = count < total ? count : total;
        wallets = new address[](n);
        composites = new uint16[](n);
        if (n == 0) return (wallets, composites);

        bool[] memory used = new bool[](total);
        for (uint256 i = 0; i < n; i++) {
            uint256 bestIdx = type(uint256).max;
            uint16 bestScore = 0;
            for (uint256 j = 0; j < total; j++) {
                if (used[j]) continue;
                uint16 s = profiles[allWallets[j]].composite;
                if (bestIdx == type(uint256).max || s > bestScore) {
                    bestScore = s;
                    bestIdx = j;
                }
            }
            used[bestIdx] = true;
            wallets[i] = allWallets[bestIdx];
            composites[i] = bestScore;
        }
    }

    // --- Internal ---

    function _targetComposite(address wallet, uint16 oldComposite, uint16 rawComposite, uint8 flagSeverity)
        private
        returns (uint16)
    {
        // Decreases always apply immediately so penalties are never delayed.
        if (rawComposite <= oldComposite) return rawComposite;
        // Frozen wallets cannot grow.
        if (flagSeverity >= SEVERITY_FROZEN) return oldComposite;
        // Otherwise clamp growth to the rolling daily allowance.
        uint16 allowed = _dailyMaxAllowed(wallet, oldComposite);
        return rawComposite > allowed ? allowed : rawComposite;
    }

    function _dailyMaxAllowed(address wallet, uint16 currentComposite) private returns (uint16) {
        DailyAnchor storage d = dailyAnchor[wallet];
        if (d.anchorTime == 0 || block.timestamp - d.anchorTime >= 1 days) {
            d.anchorComposite = currentComposite;
            d.anchorTime = uint64(block.timestamp);
        }
        uint256 pct = (uint256(d.anchorComposite) * DAILY_CAP_BPS) / 10_000;
        uint256 growth = pct > MIN_DAILY_GROWTH ? pct : MIN_DAILY_GROWTH;
        uint256 allowed = uint256(d.anchorComposite) + growth;
        if (allowed > COMPOSITE_MAX) allowed = COMPOSITE_MAX;
        return uint16(allowed);
    }

    function _emitScoreUpdated(address wallet, Work memory w, uint16 newComposite, bytes32 attestationHash) private {
        emit ScoreUpdated(
            wallet,
            w.oldComposite,
            newComposite,
            int256(uint256(w.builder)) - int256(uint256(w.oldBuilder)),
            int256(uint256(w.advocate)) - int256(uint256(w.oldAdvocate)),
            int256(uint256(w.community)) - int256(uint256(w.oldCommunity)),
            int256(uint256(w.user)) - int256(uint256(w.oldUser)),
            attestationHash
        );
        activity.emitScoreUpdated(
            wallet, newComposite, int256(uint256(newComposite)) - int256(uint256(w.oldComposite)), attestationHash
        );
    }

    function _toLower(string memory s) internal pure returns (string memory) {
        bytes memory b = bytes(s);
        for (uint256 i = 0; i < b.length; i++) {
            uint8 ch = uint8(b[i]);
            if (ch >= 65 && ch <= 90) {
                b[i] = bytes1(ch + 32);
            }
        }
        return string(b);
    }
}
