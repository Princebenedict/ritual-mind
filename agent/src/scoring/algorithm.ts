import type {
  AdvocateMetrics,
  AdvocatePost,
  BuilderMetrics,
  CommunityMetrics,
  ScoreFlags,
  SubScores,
  UserMetrics,
  WalletScoreContext,
  WalletScoreResult,
} from "./types.js";

/**
 * The Ritual Mind scoring algorithm. Four components sum to a composite out of 1000.
 * This module computes the raw sub scores exactly as specified. The on chain
 * WalletRegistry then applies the new wallet multiplier, the per component caps, the
 * fifteen percent daily cap, and the freeze rule. Both layers enforce the ceilings so
 * the agent can never write an out of range score.
 */

export const SCORE_MAX = {builder: 400, advocate: 300, community: 200, user: 100, composite: 1000} as const;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return Math.round(value);
}

// --- Builder, max 400 ---

export function computeBuilder(m: BuilderMetrics): number {
  let score = 0;
  score += Math.min(m.contractsDeployed, 5) * 25; // max 125
  score += Math.min(m.uniquePrecompilesUsed, 5) * 30; // max 150
  score += m.hasActiveRegisteredProject ? 40 : 0;
  score += Math.min(m.externalWalletsUsingProject * 2, 100); // max 100
  score += clamp(m.codeQualityScore, 0, 50);
  score += m.testnetContributions * 10;
  score -= m.abandonedContracts * 20;
  score -= m.duplicateClones * 50;
  return clamp(score, 0, SCORE_MAX.builder);
}

// --- Advocate, max 300 ---

function qualityMultiplier(qualityScore: number): number {
  const q = clamp(qualityScore, 1, 10);
  // Linear map from quality 1..10 to multiplier 0.5..2.0.
  return 0.5 + ((q - 1) / 9) * 1.5;
}

function reachMultiplier(impressions: number): number {
  if (impressions < 100) return 0.5;
  if (impressions < 1_000) return 1.0;
  if (impressions < 10_000) return 1.5;
  if (impressions < 100_000) return 2.0;
  return 2.5;
}

function scoreOnePost(post: AdvocatePost): number {
  const engagement = 3 * qualityMultiplier(post.qualityScore) * reachMultiplier(post.impressions);
  let value = engagement;
  if (post.retweetedByRitual) value += 20;
  if (post.isOriginalThread) value += 15;
  if (post.hasVideo) value += 25;
  if (post.isRepetitiveLowEffort) value -= 5;
  return value;
}

export function computeAdvocate(m: AdvocateMetrics): {score: number; flags: ScoreFlags} {
  let subtotal = m.posts.reduce((sum, post) => sum + scoreOnePost(post), 0);

  // Weekly streak multiplier, 1.1 per week. Capped to avoid runaway exponents; the
  // final clamp to 300 is the hard ceiling.
  const streakWeeks = clamp(m.weeklyStreakWeeks, 0, 20);
  subtotal *= Math.pow(1.1, streakWeeks);

  // Penalties. Spam and purchased engagement lower the score and raise flags.
  subtotal -= m.spamPostCount * 50;
  const flags: ScoreFlags = {spamFreeze: m.spamPostCount > 0, purchasedPermanentFlag: m.purchasedEngagement};
  if (m.purchasedEngagement) subtotal -= 100;

  return {score: clamp(subtotal, 0, SCORE_MAX.advocate), flags};
}

// --- Community, max 200 ---

export function computeCommunity(m: CommunityMetrics): number {
  let score = 0;
  score += m.attestationsFromVerifiedBuilders * 8;
  score += m.attestationsFromRegularWallets * 3;
  score += m.attestationsGiven * 2;
  score += m.forumContributions * 5;
  score += m.debugHelps * 10;
  score -= m.mutualAttestationRings * 30;
  score -= m.selfAttestations * 50;
  return clamp(score, 0, SCORE_MAX.community);
}

// --- User, max 100 ---

function holdingBonus(ritualBalance: number): number {
  if (ritualBalance >= 10) return 20;
  if (ritualBalance >= 1) return 10;
  if (ritualBalance >= 0.1) return 5;
  return 0;
}

export function computeUser(m: UserMetrics): number {
  let score = 0;
  score += Math.min(m.uniqueDappsUsed, 10) * 5; // max 50
  score += Math.min(m.weeksActive, 10) * 3; // max 30
  score += holdingBonus(m.ritualBalance);
  score += m.precompilesUsedAsUser >= 3 ? 15 : 0;
  score -= m.botLikePattern ? 30 : 0;
  return clamp(score, 0, SCORE_MAX.user);
}

// --- Composite ---

export function scoreWallet(ctx: WalletScoreContext): WalletScoreResult {
  const builder = computeBuilder(ctx.builder);
  const advocateResult = computeAdvocate(ctx.advocate);
  const community = computeCommunity(ctx.community);
  const user = computeUser(ctx.user);

  const scores: SubScores = {builder, advocate: advocateResult.score, community, user};
  const composite = clamp(builder + advocateResult.score + community + user, 0, SCORE_MAX.composite);

  return {
    wallet: ctx.wallet,
    scores,
    composite,
    weeklyStreak: clamp(ctx.advocate.weeklyStreakWeeks, 0, 65535),
    isVerifiedBuilder: ctx.isVerifiedBuilder,
    contractsDeployed: clamp(ctx.builder.contractsDeployed, 0, 255),
    precompilesUsed: clamp(ctx.builder.uniquePrecompilesUsed, 0, 255),
    attestationsGiven: clamp(ctx.community.attestationsGiven, 0, 65535),
    flags: advocateResult.flags,
  };
}
