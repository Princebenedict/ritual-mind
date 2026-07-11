// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "./base/Ownable.sol";
import {IBadgeNFT} from "./interfaces/IBadgeNFT.sol";

/// @title BadgeNFT
/// @notice Ten soulbound achievement badges. Each wallet can hold each badge once.
///         Badges are soulbound by construction. There are no transfer, approve, or
///         operator functions on this contract, so a badge can never leave the wallet
///         that earned it. Read surfaces (ownerOf, tokenURI, badgeCount) exist for
///         explorers and the SDK.
contract BadgeNFT is Ownable, IBadgeNFT {
    string public constant name = "Ritual Mind Badges";
    string public constant symbol = "RMBADGE";
    uint8 public constant BADGE_COUNT = 10;

    // Badge identifiers, one indexed to match the product specification.
    uint8 public constant GENESIS_BUILDER = 1;
    uint8 public constant PRECOMPILE_PIONEER = 2;
    uint8 public constant ECOSYSTEM_ARCHITECT = 3;
    uint8 public constant POWER_POSTER = 4;
    uint8 public constant OG_RITUALIST = 5;
    uint8 public constant CONNECTOR = 6;
    uint8 public constant TRUSTED_VOICE = 7;
    uint8 public constant STREAK_MASTER = 8;
    uint8 public constant ELITE_BUILDER = 9;
    uint8 public constant RITUAL_LEGEND = 10;

    struct BadgeMeta {
        string title;
        string description;
    }

    mapping(address => bool) public isMinter;
    mapping(address => mapping(uint8 => bool)) private _hasBadge;
    mapping(address => mapping(uint8 => uint64)) private _earnedAt;
    mapping(address => uint256) private _balance;
    mapping(uint256 => address) private _ownerOf;
    mapping(uint256 => uint8) public badgeIdOf;
    mapping(uint8 => BadgeMeta) private _meta;

    uint256 public totalSupply;

    error NotMinter();
    error InvalidBadge();
    error TokenDoesNotExist();

    modifier onlyMinter() {
        if (!isMinter[msg.sender]) revert NotMinter();
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        _meta[GENESIS_BUILDER] =
            BadgeMeta("Genesis Builder", "Deployed a first contract on Ritual Chain.");
        _meta[PRECOMPILE_PIONEER] =
            BadgeMeta("Precompile Pioneer", "Used three or more distinct Ritual precompiles.");
        _meta[ECOSYSTEM_ARCHITECT] =
            BadgeMeta("Ecosystem Architect", "Used all five tracked precompile families.");
        _meta[POWER_POSTER] =
            BadgeMeta("Power Poster", "Reached the top advocate score band for quality content.");
        _meta[OG_RITUALIST] =
            BadgeMeta("OG Ritualist", "Among the first one hundred wallets registered.");
        _meta[CONNECTOR] =
            BadgeMeta("Connector", "Gave ten or more attestations to other wallets.");
        _meta[TRUSTED_VOICE] =
            BadgeMeta("Trusted Voice", "Received twenty or more attestations.");
        _meta[STREAK_MASTER] =
            BadgeMeta("Streak Master", "Sustained a six week activity streak.");
        _meta[ELITE_BUILDER] =
            BadgeMeta("Elite Builder", "Reached a builder score of three hundred or more.");
        _meta[RITUAL_LEGEND] =
            BadgeMeta("Ritual Legend", "Reached a composite score of eight hundred or more.");
    }

    /// @notice Authorize or deauthorize a minter. The ScoreOracle is the only minter.
    function setMinter(address minter, bool allowed) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        isMinter[minter] = allowed;
        emit MinterSet(minter, allowed);
    }

    /// @inheritdoc IBadgeNFT
    function mint(address to, uint8 badgeId) external onlyMinter returns (bool minted) {
        if (badgeId == 0 || badgeId > BADGE_COUNT) revert InvalidBadge();
        if (to == address(0)) revert ZeroAddress();
        if (_hasBadge[to][badgeId]) return false;

        _hasBadge[to][badgeId] = true;
        _earnedAt[to][badgeId] = uint64(block.timestamp);
        _balance[to] += 1;
        totalSupply += 1;

        // Deterministic token id, unique per (wallet, badge) pair.
        uint256 tokenId = (uint256(uint160(to)) << 8) | uint256(badgeId);
        _ownerOf[tokenId] = to;
        badgeIdOf[tokenId] = badgeId;

        emit BadgeMinted(to, badgeId, tokenId);
        return true;
    }

    // --- Views ---

    function hasBadge(address wallet, uint8 badgeId) external view returns (bool) {
        return _hasBadge[wallet][badgeId];
    }

    function badgeCount(address wallet) external view returns (uint256) {
        return _balance[wallet];
    }

    function balanceOf(address wallet) external view returns (uint256) {
        return _balance[wallet];
    }

    function earnedAt(address wallet, uint8 badgeId) external view returns (uint64) {
        return _earnedAt[wallet][badgeId];
    }

    function badgeTitle(uint8 badgeId) external view returns (string memory) {
        if (badgeId == 0 || badgeId > BADGE_COUNT) revert InvalidBadge();
        return _meta[badgeId].title;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address holder = _ownerOf[tokenId];
        if (holder == address(0)) revert TokenDoesNotExist();
        return holder;
    }

    /// @notice On chain metadata as a plain JSON data URI. No off chain hosting.
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        uint8 badgeId = badgeIdOf[tokenId];
        if (badgeId == 0) revert TokenDoesNotExist();
        BadgeMeta memory m = _meta[badgeId];
        return string(
            abi.encodePacked(
                "data:application/json;charset=utf-8,",
                '{"name":"',
                m.title,
                '","description":"',
                m.description,
                '","attributes":[{"trait_type":"Badge","value":',
                _toString(badgeId),
                '},{"trait_type":"Soulbound","value":"true"}]}'
            )
        );
    }

    /// @notice ERC165. Advertises ERC165 only. This collection is intentionally not
    ///         ERC721 because badges are non transferable and expose no transfer API.
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7; // ERC165
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
