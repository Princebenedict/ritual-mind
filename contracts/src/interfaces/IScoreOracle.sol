// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IWalletRegistry} from "./IWalletRegistry.sol";
import {IProjectRegistry} from "./IProjectRegistry.sol";

/// @title IScoreOracle
/// @notice TEE trust anchor. Only authorized agents, which run inside a verified
///         enclave and are registered by the owner with their attestation key, may
///         write scores, flag clusters, or post digests.
interface IScoreOracle {
    event AgentAuthorized(address indexed agent, bytes32 teeKey);
    event AgentRevoked(address indexed agent);
    event ClusterFlagged(uint256 indexed clusterId, uint256 size, uint8 severity, bytes32 attestationHash);

    // Owner actions.
    function authorizeAgent(address agent, bytes32 teeKey) external;
    function revokeAgent(address agent) external;

    // Agent actions.
    function submitUpdate(IWalletRegistry.ScoreInput calldata input) external;
    function batchSubmit(IWalletRegistry.ScoreInput[] calldata inputs) external;
    function flagCluster(
        uint256 clusterId,
        address[] calldata wallets,
        uint8 severity,
        string calldata reason,
        bytes32 attestationHash
    ) external;
    function submitProjectMetrics(IProjectRegistry.MetricsInput calldata input) external;
    function batchProjectMetrics(IProjectRegistry.MetricsInput[] calldata inputs) external;
    function recordAgentExecution(bytes32 jobId, uint256 walletsProcessed, bytes32 attestationHash) external;
    function postDigest(uint256 dayIndex, string calldata ipfsCid, bytes32 attestationHash) external;
    function confirmTwitter(address wallet) external;
    function noteContractDeployed(address deployer, address contractAddress) external;
    function noteSocialMilestone(address wallet, string calldata kind, uint256 value) external;

    // Views.
    function isAuthorizedAgent(address agent) external view returns (bool);
    function agentTeeKey(address agent) external view returns (bytes32);
}
