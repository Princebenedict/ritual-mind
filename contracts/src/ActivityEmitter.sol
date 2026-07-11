// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "./base/Ownable.sol";
import {IActivityEmitter} from "./interfaces/IActivityEmitter.sol";

/// @title ActivityEmitter
/// @notice The single on chain event source for the live feed. Frontends and the
///         SDK subscribe here for every ecosystem event. Writes are gated to an
///         explicit set of authorized writer contracts so the feed cannot be
///         spammed by arbitrary callers.
contract ActivityEmitter is Ownable, IActivityEmitter {
    mapping(address => bool) public isWriter;

    event WriterSet(address indexed writer, bool allowed);

    error NotWriter();

    modifier onlyWriter() {
        if (!isWriter[msg.sender]) revert NotWriter();
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Authorize or deauthorize a contract to emit feed events.
    function setWriter(address writer, bool allowed) external onlyOwner {
        if (writer == address(0)) revert ZeroAddress();
        isWriter[writer] = allowed;
        emit WriterSet(writer, allowed);
    }

    function emitContractDeployed(address deployer, address contractAddress) external onlyWriter {
        emit ContractDeployed(deployer, contractAddress, block.timestamp);
    }

    function emitProjectRegistered(address contractAddress, address deployer, string calldata name, uint8 category)
        external
        onlyWriter
    {
        emit ProjectRegistered(contractAddress, deployer, name, category);
    }

    function emitScoreUpdated(address wallet, uint256 composite, int256 delta, bytes32 attestationHash)
        external
        onlyWriter
    {
        emit ScoreUpdated(wallet, composite, delta, attestationHash);
    }

    function emitAttestationGiven(address from, address to, uint8 weight) external onlyWriter {
        emit AttestationGiven(from, to, weight);
    }

    function emitBadgeEarned(address wallet, uint8 badgeId) external onlyWriter {
        emit BadgeEarned(wallet, badgeId);
    }

    function emitAgentExecution(bytes32 jobId, uint256 walletsProcessed, bytes32 attestationHash) external onlyWriter {
        emit AgentExecution(jobId, walletsProcessed, attestationHash);
    }

    function emitSocialMilestone(address wallet, string calldata kind, uint256 value) external onlyWriter {
        emit SocialMilestone(wallet, kind, value);
    }

    function emitDigestPosted(uint256 dayIndex, string calldata ipfsCid, bytes32 attestationHash) external onlyWriter {
        emit DigestPosted(dayIndex, ipfsCid, attestationHash);
    }

    function emitWalletFlagged(address wallet, uint8 severity, string calldata reason) external onlyWriter {
        emit WalletFlagged(wallet, severity, reason);
    }
}
