/** Minimal ABIs for the reads and writes the SDK performs. */

export const WALLET_REGISTRY_ABI = [
  {
    type: "function",
    name: "getProfile",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [
      {
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
] as const;

export const BADGE_NFT_ABI = [
  {
    type: "function",
    name: "hasBadge",
    stateMutability: "view",
    inputs: [
      {name: "wallet", type: "address"},
      {name: "badgeId", type: "uint8"},
    ],
    outputs: [{type: "bool"}],
  },
  {
    type: "function",
    name: "earnedAt",
    stateMutability: "view",
    inputs: [
      {name: "wallet", type: "address"},
      {name: "badgeId", type: "uint8"},
    ],
    outputs: [{type: "uint64"}],
  },
  {
    type: "function",
    name: "badgeCount",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [{type: "uint256"}],
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
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      {name: "contractAddress", type: "address"},
      {name: "name", type: "string"},
      {name: "description", type: "string"},
      {name: "category", type: "uint8"},
      {name: "url", type: "string"},
      {name: "repoUrl", type: "string"},
    ],
    outputs: [],
  },
] as const;

export const ACTIVITY_EMITTER_ABI = [
  {
    type: "function",
    name: "emitContractDeployed",
    stateMutability: "nonpayable",
    inputs: [
      {name: "deployer", type: "address"},
      {name: "contractAddress", type: "address"},
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "emitSocialMilestone",
    stateMutability: "nonpayable",
    inputs: [
      {name: "wallet", type: "address"},
      {name: "kind", type: "string"},
      {name: "value", type: "uint256"},
    ],
    outputs: [],
  },
] as const;

/** Badge titles, aligned with the BadgeNFT contract, one indexed. */
export const BADGE_TITLES: Record<number, string> = {
  1: "Genesis Builder",
  2: "Precompile Pioneer",
  3: "Ecosystem Architect",
  4: "Power Poster",
  5: "OG Ritualist",
  6: "Connector",
  7: "Trusted Voice",
  8: "Streak Master",
  9: "Elite Builder",
  10: "Ritual Legend",
};

/** Category enum order, aligned with the ProjectRegistry contract. */
export const CATEGORY_BY_INDEX = [
  "DEFI",
  "GOVERNANCE",
  "AGENT",
  "MARKETPLACE",
  "SOCIAL",
  "INFRASTRUCTURE",
  "GAMING",
  "OTHER",
] as const;
