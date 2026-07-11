// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IActivityEmitter
/// @notice The single event source for the live feed. Only authorized writer
///         contracts (WalletRegistry, ProjectRegistry, ScoreOracle) may emit.
interface IActivityEmitter {
    event ContractDeployed(address indexed deployer, address indexed contractAddress, uint256 timestamp);
    event ProjectRegistered(address indexed contractAddress, address indexed deployer, string name, uint8 category);
    event ScoreUpdated(address indexed wallet, uint256 composite, int256 delta, bytes32 attestationHash);
    event AttestationGiven(address indexed from, address indexed to, uint8 weight);
    event BadgeEarned(address indexed wallet, uint8 indexed badgeId);
    event AgentExecution(bytes32 indexed jobId, uint256 walletsProcessed, bytes32 attestationHash);
    event SocialMilestone(address indexed wallet, string kind, uint256 value);
    event DigestPosted(uint256 indexed dayIndex, string ipfsCid, bytes32 attestationHash);
    event WalletFlagged(address indexed wallet, uint8 severity, string reason);

    function emitContractDeployed(address deployer, address contractAddress) external;
    function emitProjectRegistered(address contractAddress, address deployer, string calldata name, uint8 category)
        external;
    function emitScoreUpdated(address wallet, uint256 composite, int256 delta, bytes32 attestationHash) external;
    function emitAttestationGiven(address from, address to, uint8 weight) external;
    function emitBadgeEarned(address wallet, uint8 badgeId) external;
    function emitAgentExecution(bytes32 jobId, uint256 walletsProcessed, bytes32 attestationHash) external;
    function emitSocialMilestone(address wallet, string calldata kind, uint256 value) external;
    function emitDigestPosted(uint256 dayIndex, string calldata ipfsCid, bytes32 attestationHash) external;
    function emitWalletFlagged(address wallet, uint8 severity, string calldata reason) external;
}
