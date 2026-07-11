// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IBadgeNFT
/// @notice Soulbound badge collection. Badges are minted by the authorized minter
///         (the ScoreOracle) when a wallet crosses a threshold. Badges cannot move.
interface IBadgeNFT {
    event BadgeMinted(address indexed to, uint8 indexed badgeId, uint256 indexed tokenId);
    event MinterSet(address indexed minter, bool allowed);

    /// @notice Mint a badge if the wallet does not already hold it.
    /// @return minted True when a new badge was minted, false when already held.
    function mint(address to, uint8 badgeId) external returns (bool minted);

    function setMinter(address minter, bool allowed) external;

    function hasBadge(address wallet, uint8 badgeId) external view returns (bool);
    function badgeCount(address wallet) external view returns (uint256);
    function earnedAt(address wallet, uint8 badgeId) external view returns (uint64);
    function badgeTitle(uint8 badgeId) external view returns (string memory);
}
