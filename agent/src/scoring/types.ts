import type {Address} from "viem";

/** Raw builder inputs gathered from the on chain scan and the code quality review. */
export interface BuilderMetrics {
  contractsDeployed: number;
  uniquePrecompilesUsed: number;
  hasActiveRegisteredProject: boolean;
  externalWalletsUsingProject: number;
  codeQualityScore: number; // 0..50, from the LLM audit
  testnetContributions: number; // issues or PRs
  abandonedContracts: number; // idle 14 days or more
  duplicateClones: number;
}

/** One scored social post. Quality and originality come from the content LLM pass. */
export interface AdvocatePost {
  qualityScore: number; // 1..10 from the LLM
  impressions: number;
  retweetedByRitual: boolean;
  isOriginalThread: boolean; // five or more tweets
  hasVideo: boolean;
  isRepetitiveLowEffort: boolean;
}

export interface AdvocateMetrics {
  posts: AdvocatePost[];
  weeklyStreakWeeks: number;
  spamPostCount: number;
  purchasedEngagement: boolean;
}

export interface CommunityMetrics {
  attestationsFromVerifiedBuilders: number;
  attestationsFromRegularWallets: number;
  attestationsGiven: number;
  forumContributions: number; // verified
  debugHelps: number; // attested
  mutualAttestationRings: number;
  selfAttestations: number;
}

export interface UserMetrics {
  uniqueDappsUsed: number;
  weeksActive: number;
  ritualBalance: number; // whole RITUAL units
  precompilesUsedAsUser: number;
  botLikePattern: boolean;
}

/** Everything needed to score one wallet in a cycle. */
export interface WalletScoreContext {
  wallet: Address;
  walletAgeDays: number;
  isVerifiedBuilder: boolean;
  builder: BuilderMetrics;
  advocate: AdvocateMetrics;
  community: CommunityMetrics;
  user: UserMetrics;
}

export interface SubScores {
  builder: number;
  advocate: number;
  community: number;
  user: number;
}

export interface ScoreFlags {
  /** Spam detected. Advocate score frozen for seven days off chain, penalty applied. */
  spamFreeze: boolean;
  /** Purchased engagement detected. Permanent flag recommended to the oracle. */
  purchasedPermanentFlag: boolean;
}

export interface WalletScoreResult {
  wallet: Address;
  scores: SubScores;
  composite: number;
  weeklyStreak: number;
  isVerifiedBuilder: boolean;
  contractsDeployed: number;
  precompilesUsed: number;
  attestationsGiven: number;
  flags: ScoreFlags;
}
