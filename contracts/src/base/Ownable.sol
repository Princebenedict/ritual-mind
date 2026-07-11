// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Ownable
/// @notice Minimal two step ownership. Kept dependency free so the contract set
///         compiles without external libraries. Ownership transfer is two step to
///         avoid handing control to an unreachable address by mistake.
abstract contract Ownable {
    address public owner;
    address public pendingOwner;

    error NotOwner();
    error ZeroAddress();
    error NotPendingOwner();

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner = initialOwner;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    /// @notice Begin an ownership transfer. The new owner must call acceptOwnership.
    function transferOwnership(address newOwner) external onlyOwner {
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Complete an ownership transfer started by the current owner.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        address previous = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        emit OwnershipTransferred(previous, owner);
    }
}
