import type {Address} from "viem";

/** Configuration for the Ritual Mind client. Addresses come from your deployment. */
export interface RitualMindConfig {
  /** RPC endpoint. Defaults to the public Ritual RPC. */
  rpcUrl?: string;
  /** WalletRegistry address. Required for score and leaderboard reads. */
  walletRegistry: Address;
  /** ProjectRegistry address. Required for project reads and registration. */
  projectRegistry?: Address;
  /** BadgeNFT address. Required for badge reads. */
  badgeNFT?: Address;
  /** ActivityEmitter address. Required for emitting feed events. */
  activityEmitter?: Address;
}

/** A wallet reputation score with its four components and rank. */
export interface Score {
  address: Address;
  twitterHandle: string;
  builder: number;
  advocate: number;
  community: number;
  user: number;
  composite: number;
  globalRank: number;
  isVerifiedBuilder: boolean;
  weeklyStreak: number;
  attestationsReceived: number;
  registrationNumber: number;
  flagSeverity: number;
}

/** An earned soulbound badge. */
export interface Badge {
  id: number;
  title: string;
  earnedAt: number;
}

/** Project category, aligned with the ProjectRegistry enum. */
export type ProjectCategory =
  | "DEFI"
  | "GOVERNANCE"
  | "AGENT"
  | "MARKETPLACE"
  | "SOCIAL"
  | "INFRASTRUCTURE"
  | "GAMING"
  | "OTHER";

/** Project metrics maintained by the agent through the oracle. */
export interface ProjectMetrics {
  address: Address;
  deployer: Address;
  name: string;
  description: string;
  category: ProjectCategory;
  weeklyActiveWallets: number;
  totalTxns: number;
  healthScore: number;
  growthRate: number;
  communityScore: number;
  isVerified: boolean;
  isActive: boolean;
}

/** Parameters to register a project. */
export interface RegisterProjectParams {
  contractAddress: Address;
  name: string;
  description: string;
  category: ProjectCategory;
  url: string;
  repoUrl: string;
}
