/**
 * Minimal ABIs for the contracts the agent reads and writes. Only the members the
 * agent uses are declared. Kept as const for viem type inference.
 */

export const SCORE_ORACLE_ABI = [
  {
    type: "function",
    name: "submitUpdate",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "input",
        type: "tuple",
        components: [
          {name: "wallet", type: "address"},
          {name: "builderScore", type: "uint16"},
          {name: "advocateScore", type: "uint16"},
          {name: "communityScore", type: "uint16"},
          {name: "userScore", type: "uint16"},
          {name: "weeklyStreak", type: "uint16"},
          {name: "contractsDeployed", type: "uint8"},
          {name: "precompilesUsed", type: "uint8"},
          {name: "attestationsGiven", type: "uint16"},
          {name: "isVerifiedBuilder", type: "bool"},
          {name: "attestationHash", type: "bytes32"},
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "batchSubmit",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "inputs",
        type: "tuple[]",
        components: [
          {name: "wallet", type: "address"},
          {name: "builderScore", type: "uint16"},
          {name: "advocateScore", type: "uint16"},
          {name: "communityScore", type: "uint16"},
          {name: "userScore", type: "uint16"},
          {name: "weeklyStreak", type: "uint16"},
          {name: "contractsDeployed", type: "uint8"},
          {name: "precompilesUsed", type: "uint8"},
          {name: "attestationsGiven", type: "uint16"},
          {name: "isVerifiedBuilder", type: "bool"},
          {name: "attestationHash", type: "bytes32"},
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "flagCluster",
    stateMutability: "nonpayable",
    inputs: [
      {name: "clusterId", type: "uint256"},
      {name: "wallets", type: "address[]"},
      {name: "severity", type: "uint8"},
      {name: "reason", type: "string"},
      {name: "attestationHash", type: "bytes32"},
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "submitProjectMetrics",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "input",
        type: "tuple",
        components: [
          {name: "contractAddress", type: "address"},
          {name: "weeklyActiveWallets", type: "uint32"},
          {name: "totalTxns", type: "uint32"},
          {name: "healthScore", type: "uint16"},
          {name: "growthRate", type: "int32"},
          {name: "communityScore", type: "uint16"},
          {name: "isActive", type: "bool"},
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "batchProjectMetrics",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "inputs",
        type: "tuple[]",
        components: [
          {name: "contractAddress", type: "address"},
          {name: "weeklyActiveWallets", type: "uint32"},
          {name: "totalTxns", type: "uint32"},
          {name: "healthScore", type: "uint16"},
          {name: "growthRate", type: "int32"},
          {name: "communityScore", type: "uint16"},
          {name: "isActive", type: "bool"},
        ],
      },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "recordAgentExecution",
    stateMutability: "nonpayable",
    inputs: [
      {name: "jobId", type: "bytes32"},
      {name: "walletsProcessed", type: "uint256"},
      {name: "attestationHash", type: "bytes32"},
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "postDigest",
    stateMutability: "nonpayable",
    inputs: [
      {name: "dayIndex", type: "uint256"},
      {name: "ipfsCid", type: "string"},
      {name: "attestationHash", type: "bytes32"},
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "confirmTwitter",
    stateMutability: "nonpayable",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [],
  },
  {
    type: "function",
    name: "noteContractDeployed",
    stateMutability: "nonpayable",
    inputs: [
      {name: "deployer", type: "address"},
      {name: "contractAddress", type: "address"},
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "noteSocialMilestone",
    stateMutability: "nonpayable",
    inputs: [
      {name: "wallet", type: "address"},
      {name: "kind", type: "string"},
      {name: "value", type: "uint256"},
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isAuthorizedAgent",
    stateMutability: "view",
    inputs: [{name: "agent", type: "address"}],
    outputs: [{type: "bool"}],
  },
] as const;

export const WALLET_REGISTRY_ABI = [
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          {name: "wallet", type: "address"},
          {name: "twitterHandle", type: "string"},
          {name: "builderScore", type: "uint16"},
          {name: "advocateScore", type: "uint16"},
          {name: "communityScore", type: "uint16"},
          {name: "userScore", type: "uint16"},
          {name: "composite", type: "uint16"},
          {name: "globalRank", type: "uint32"},
          {name: "registeredAt", type: "uint64"},
          {name: "lastUpdated", type: "uint64"},
          {name: "isVerifiedBuilder", type: "bool"},
          {name: "weeklyStreak", type: "uint16"},
          {name: "attestationsReceived", type: "uint32"},
          {name: "registrationNumber", type: "uint32"},
          {name: "flagSeverity", type: "uint8"},
        ],
      },
    ],
  },
  {
    type: "function",
    name: "getTopWallets",
    stateMutability: "view",
    inputs: [{name: "count", type: "uint256"}],
    outputs: [
      {name: "wallets", type: "address[]"},
      {name: "composites", type: "uint16[]"},
    ],
  },
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [{type: "bool"}],
  },
  {
    type: "function",
    name: "isTwitterVerified",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [{type: "bool"}],
  },
  {
    type: "function",
    name: "totalRegistered",
    stateMutability: "view",
    inputs: [],
    outputs: [{type: "uint256"}],
  },
  {
    type: "function",
    name: "attestationsGivenCount",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [{type: "uint32"}],
  },
] as const;

export const PROJECT_REGISTRY_ABI = [
  {
    type: "function",
    name: "getProject",
    stateMutability: "view",
    inputs: [{name: "contractAddress", type: "address"}],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          {name: "contractAddress", type: "address"},
          {name: "deployer", type: "address"},
          {name: "name", type: "string"},
          {name: "description", type: "string"},
          {name: "category", type: "uint8"},
          {name: "url", type: "string"},
          {name: "repoUrl", type: "string"},
          {name: "weeklyActiveWallets", type: "uint32"},
          {name: "totalTxns", type: "uint32"},
          {name: "healthScore", type: "uint16"},
          {name: "growthRate", type: "int32"},
          {name: "communityScore", type: "uint16"},
          {name: "isVerified", type: "bool"},
          {name: "isActive", type: "bool"},
          {name: "registeredAt", type: "uint64"},
          {name: "lastUpdated", type: "uint64"},
        ],
      },
    ],
  },
  {
    type: "function",
    name: "totalProjects",
    stateMutability: "view",
    inputs: [],
    outputs: [{type: "uint256"}],
  },
] as const;

export const RITUAL_WALLET_ABI = [
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [{name: "lockDuration", type: "uint256"}],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{name: "account", type: "address"}],
    outputs: [{type: "uint256"}],
  },
  {
    type: "function",
    name: "lockUntil",
    stateMutability: "view",
    inputs: [{name: "account", type: "address"}],
    outputs: [{type: "uint256"}],
  },
] as const;

export const TEE_SERVICE_REGISTRY_ABI = [
  {
    type: "function",
    name: "getServicesByCapability",
    stateMutability: "view",
    inputs: [
      {name: "capability", type: "uint8"},
      {name: "checkValidity", type: "bool"},
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          {
            name: "node",
            type: "tuple",
            components: [
              {name: "paymentAddress", type: "address"},
              {name: "teeAddress", type: "address"},
              {name: "teeType", type: "uint8"},
              {name: "publicKey", type: "bytes"},
              {name: "endpoint", type: "string"},
              {name: "certPubKeyHash", type: "bytes32"},
              {name: "capability", type: "uint8"},
            ],
          },
          {name: "isValid", type: "bool"},
          {name: "workloadId", type: "bytes32"},
        ],
      },
    ],
  },
] as const;
