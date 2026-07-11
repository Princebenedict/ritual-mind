// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "./base/Ownable.sol";
import {IProjectRegistry} from "./interfaces/IProjectRegistry.sol";
import {IActivityEmitter} from "./interfaces/IActivityEmitter.sol";

/// @title ProjectRegistry
/// @notice Registry of ecosystem projects. Anyone can register a project. Metrics are
///         maintained by an authorized updater, which is the ScoreOracle acting on the
///         agent's measurements. Verification is an owner action gated on real usage.
contract ProjectRegistry is Ownable, IProjectRegistry {
    IActivityEmitter public immutable activity;

    mapping(address => bool) public isUpdater;
    mapping(address => Project) internal projects;
    mapping(address => bool) public isRegisteredProject;
    mapping(Category => address[]) internal categoryIndex;
    address[] internal allProjects;

    error NotUpdater();
    error ProjectExists();
    error ProjectNotFound();
    error InvalidName();

    modifier onlyUpdater() {
        if (!isUpdater[msg.sender]) revert NotUpdater();
        _;
    }

    constructor(address initialOwner, address activityEmitter) Ownable(initialOwner) {
        if (activityEmitter == address(0)) revert ZeroAddress();
        activity = IActivityEmitter(activityEmitter);
    }

    // --- Owner wiring ---

    function setUpdater(address updater, bool allowed) external onlyOwner {
        if (updater == address(0)) revert ZeroAddress();
        isUpdater[updater] = allowed;
        emit UpdaterSet(updater, allowed);
    }

    // --- Registration ---

    function register(
        address contractAddress,
        string calldata name,
        string calldata description,
        Category category,
        string calldata url,
        string calldata repoUrl
    ) external {
        if (contractAddress == address(0)) revert ZeroAddress();
        if (isRegisteredProject[contractAddress]) revert ProjectExists();
        uint256 nameLen = bytes(name).length;
        if (nameLen == 0 || nameLen > 64) revert InvalidName();

        Project storage pr = projects[contractAddress];
        pr.contractAddress = contractAddress;
        pr.deployer = msg.sender;
        pr.name = name;
        pr.description = description;
        pr.category = category;
        pr.url = url;
        pr.repoUrl = repoUrl;
        pr.isActive = true;
        pr.registeredAt = uint64(block.timestamp);
        pr.lastUpdated = uint64(block.timestamp);

        isRegisteredProject[contractAddress] = true;
        allProjects.push(contractAddress);
        categoryIndex[category].push(contractAddress);

        emit ProjectRegistered(contractAddress, msg.sender, name, category);
        activity.emitProjectRegistered(contractAddress, msg.sender, name, uint8(category));
    }

    // --- Updater actions ---

    function updateMetrics(MetricsInput calldata input) external onlyUpdater {
        if (!isRegisteredProject[input.contractAddress]) revert ProjectNotFound();
        Project storage pr = projects[input.contractAddress];
        pr.weeklyActiveWallets = input.weeklyActiveWallets;
        pr.totalTxns = input.totalTxns;
        pr.healthScore = input.healthScore > 1000 ? 1000 : input.healthScore;
        pr.growthRate = input.growthRate;
        pr.communityScore = input.communityScore > 1000 ? 1000 : input.communityScore;
        pr.isActive = input.isActive;
        pr.lastUpdated = uint64(block.timestamp);
        emit MetricsUpdated(input.contractAddress, input.weeklyActiveWallets, pr.healthScore);
    }

    // --- Owner verification ---

    function verifyProject(address contractAddress) external onlyOwner {
        if (!isRegisteredProject[contractAddress]) revert ProjectNotFound();
        projects[contractAddress].isVerified = true;
        emit ProjectVerified(contractAddress);
    }

    // --- Views ---

    function getProject(address contractAddress) external view returns (Project memory) {
        return projects[contractAddress];
    }

    function getByCategory(Category category) external view returns (address[] memory) {
        return categoryIndex[category];
    }

    function totalProjects() external view returns (uint256) {
        return allProjects.length;
    }

    /// @notice Return the top trending projects. Trending weighs health by active
    ///         wallets, adds positive growth, and gives verified projects a small edge.
    function getTrending(uint256 count) external view returns (address[] memory contracts, uint256[] memory scores) {
        uint256 total = allProjects.length;
        uint256 n = count < total ? count : total;
        contracts = new address[](n);
        scores = new uint256[](n);
        if (n == 0) return (contracts, scores);

        bool[] memory used = new bool[](total);
        for (uint256 i = 0; i < n; i++) {
            uint256 bestIdx = type(uint256).max;
            uint256 bestScore = 0;
            for (uint256 j = 0; j < total; j++) {
                if (used[j]) continue;
                uint256 s = _trendingScore(projects[allProjects[j]]);
                if (bestIdx == type(uint256).max || s > bestScore) {
                    bestScore = s;
                    bestIdx = j;
                }
            }
            used[bestIdx] = true;
            contracts[i] = allProjects[bestIdx];
            scores[i] = bestScore;
        }
    }

    function _trendingScore(Project storage pr) internal view returns (uint256) {
        if (!pr.isActive) return 0;
        uint256 base = uint256(pr.healthScore) * (uint256(pr.weeklyActiveWallets) + 1);
        if (pr.growthRate > 0) {
            base += (base * uint256(int256(pr.growthRate))) / 10_000;
        }
        if (pr.isVerified) {
            base += base / 10;
        }
        return base;
    }
}
