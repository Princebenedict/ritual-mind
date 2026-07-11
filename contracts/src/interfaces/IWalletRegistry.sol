// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IWalletRegistry
/// @notice Scored identity registry. Structs are shared with the oracle and the SDK.
interface IWalletRegistry {
    /// @notice The full on chain identity for a wallet.
    struct WalletProfile {
        address wallet;
        string twitterHandle;
        uint16 builderScore; // 0..400
        uint16 advocateScore; // 0..300
        uint16 communityScore; // 0..200
        uint16 userScore; // 0..100
        uint16 composite; // 0..1000, always equal to the sum of the four sub scores
        uint32 globalRank;
        uint64 registeredAt;
        uint64 lastUpdated;
        bool isVerifiedBuilder;
        uint16 weeklyStreak;
        uint32 attestationsReceived;
        uint32 registrationNumber;
        uint8 flagSeverity; // 0 clean, 1 watch, 2 restricted, 3 frozen
    }

    /// @notice One immutable point in a wallet score history.
    struct ScoreSnapshot {
        uint16 composite;
        uint16 builderScore;
        uint16 advocateScore;
        uint16 communityScore;
        uint16 userScore;
        uint64 timestamp;
        bytes32 attestationHash;
    }

    /// @notice Payload the oracle submits per wallet. Raw sub scores computed by the
    ///         agent, plus the raw metrics the oracle needs for badge thresholds.
    struct ScoreInput {
        address wallet;
        uint16 builderScore;
        uint16 advocateScore;
        uint16 communityScore;
        uint16 userScore;
        uint16 weeklyStreak;
        uint8 contractsDeployed;
        uint8 precompilesUsed;
        uint16 attestationsGiven;
        bool isVerifiedBuilder;
        bytes32 attestationHash;
    }

    event Registered(address indexed wallet, uint32 registrationNumber);
    event TwitterLinked(address indexed wallet, string handle);
    event TwitterVerified(address indexed wallet, string handle);
    event Attested(address indexed from, address indexed to, uint8 weight, bool mutualEdge);
    event ScoreUpdated(
        address indexed wallet,
        uint16 oldComposite,
        uint16 newComposite,
        int256 builderDelta,
        int256 advocateDelta,
        int256 communityDelta,
        int256 userDelta,
        bytes32 attestationHash
    );
    event WalletFlagged(address indexed wallet, uint8 severity, string reason);
    event RankUpdated(address indexed wallet, uint32 rank);
    event OracleUpdated(address indexed oracle);

    // User actions.
    function register() external;
    function linkTwitter(string calldata handle) external;
    function attest(address to) external;

    // Oracle actions.
    function updateScore(ScoreInput calldata input) external returns (uint16 newComposite);
    function flagWallet(address wallet, uint8 severity, string calldata reason) external;
    function setRank(address wallet, uint32 rank) external;
    function confirmTwitterVerification(address wallet) external;

    // Owner actions.
    function setOracle(address oracle) external;

    // Views.
    function isRegistered(address wallet) external view returns (bool);
    function getProfile(address wallet) external view returns (WalletProfile memory);
    function getScoreHistory(address wallet) external view returns (ScoreSnapshot[] memory);
    function getTopWallets(uint256 count) external view returns (address[] memory wallets, uint16[] memory composites);
    function registrationNumber(address wallet) external view returns (uint32);
    function totalRegistered() external view returns (uint256);
    function isTwitterVerified(address wallet) external view returns (bool);
}
