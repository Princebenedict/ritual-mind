// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IProjectRegistry
/// @notice Registry of ecosystem projects with agent maintained metrics.
interface IProjectRegistry {
    enum Category {
        DEFI,
        GOVERNANCE,
        AGENT,
        MARKETPLACE,
        SOCIAL,
        INFRASTRUCTURE,
        GAMING,
        OTHER
    }

    struct Project {
        address contractAddress;
        address deployer;
        string name;
        string description;
        Category category;
        string url;
        string repoUrl;
        uint32 weeklyActiveWallets;
        uint32 totalTxns;
        uint16 healthScore; // 0..1000
        int32 growthRate; // basis points, may be negative
        uint16 communityScore; // 0..1000
        bool isVerified;
        bool isActive;
        uint64 registeredAt;
        uint64 lastUpdated;
    }

    /// @notice Metrics payload submitted by the authorized updater.
    struct MetricsInput {
        address contractAddress;
        uint32 weeklyActiveWallets;
        uint32 totalTxns;
        uint16 healthScore;
        int32 growthRate;
        uint16 communityScore;
        bool isActive;
    }

    event ProjectRegistered(address indexed contractAddress, address indexed deployer, string name, Category category);
    event MetricsUpdated(address indexed contractAddress, uint32 weeklyActiveWallets, uint16 healthScore);
    event ProjectVerified(address indexed contractAddress);
    event UpdaterSet(address indexed updater, bool allowed);

    function register(
        address contractAddress,
        string calldata name,
        string calldata description,
        Category category,
        string calldata url,
        string calldata repoUrl
    ) external;

    function updateMetrics(MetricsInput calldata input) external;
    function verifyProject(address contractAddress) external;
    function setUpdater(address updater, bool allowed) external;

    function getProject(address contractAddress) external view returns (Project memory);
    function getTrending(uint256 count) external view returns (address[] memory contracts, uint256[] memory scores);
    function getByCategory(Category category) external view returns (address[] memory contracts);
    function totalProjects() external view returns (uint256);
}
