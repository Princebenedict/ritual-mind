export type Address = `0x${string}`;

export type ProjectCategory =
  | "DEFI"
  | "GOVERNANCE"
  | "AGENT"
  | "MARKETPLACE"
  | "SOCIAL"
  | "INFRASTRUCTURE"
  | "GAMING"
  | "OTHER";

export interface ScoreSnapshot {
  timestamp: number;
  composite: number;
  builder: number;
  advocate: number;
  community: number;
  user: number;
  /** TEE attestation hash written with this snapshot. Verifiable evidence. */
  attestationHash: string;
}

/** Verifiable provenance for an on chain value: the contract it was read from, the
 *  transaction that wrote it, the block, the time, and a clickable explorer link. */
export interface Evidence {
  contract: Address;
  explorer: string;
  txHash?: string;
  blockNumber?: number;
  timestamp?: number;
  attestationHash?: string;
}

export interface WalletProfile {
  address: Address;
  twitterHandle: string | null;
  twitterVerified: boolean;
  builder: number;
  advocate: number;
  community: number;
  user: number;
  composite: number;
  globalRank: number;
  registeredAt: number;
  lastUpdated: number;
  isVerifiedBuilder: boolean;
  weeklyStreak: number;
  attestationsReceived: number;
  attestationsGiven: number;
  registrationNumber: number;
  flagSeverity: number;
  badges: number[];
  badgeEarnedAt: Record<number, number>;
  history: ScoreSnapshot[];
  contractsDeployed: number;
  precompilesUsed: number;
}

export interface Project {
  address: Address;
  deployer: Address;
  name: string;
  description: string;
  category: ProjectCategory;
  url: string;
  repoUrl: string;
  weeklyActiveWallets: number;
  totalTxns: number;
  healthScore: number;
  growthRate: number;
  communityScore: number;
  isVerified: boolean;
  isActive: boolean;
  registeredAt: number;
  topContributors: Address[];
  wauHistory: number[];
}

export type FeedKind =
  | "ScoreUpdated"
  | "ContractDeployed"
  | "ProjectRegistered"
  | "AttestationGiven"
  | "BadgeEarned"
  | "AgentExecution"
  | "SocialMilestone"
  | "DigestPosted"
  | "WalletFlagged";

export interface FeedItem {
  id: string;
  kind: FeedKind;
  timestamp: number;
  wallet?: Address;
  target?: Address;
  amount?: number;
  delta?: number;
  label: string;
  detail: string;
  txHash?: string;
  attestationHash?: string;
}

export interface Digest {
  dayIndex: number;
  postedAt: number;
  title: string;
  summary: string;
  sections: Array<{heading: string; body: string}>;
  highlights: string[];
  sentiment: "bullish" | "neutral" | "cautious";
  ipfsCid: string;
  attestationHash: string;
}

export interface Advocate {
  address: Address;
  handle: string;
  advocate: number;
  posts: number;
  topPostQuality: number;
}

export interface ContentHighlight {
  id: string;
  author: string;
  text: string;
  quality: number;
  impressions: number;
  kind: "thread" | "video" | "post";
}

export interface EcosystemStats {
  totalWallets: number;
  totalProjects: number;
  averageComposite: number;
  attestations: number;
  agentBalanceRitual: number;
  lastCycleAt: number;
  nextCycleAt: number;
}
