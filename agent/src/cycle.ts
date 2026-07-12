import {keccak256, toHex, isAddress, type Address, type Hex} from "viem";
import type {AgentConfig} from "./config.js";
import type {ChainClients} from "./chain/client.js";
import {WALLET_REGISTRY_ABI} from "./chain/abis.js";
import {
  batchSubmitScores,
  depositToRitualWallet,
  flagCluster,
  formatRitual,
  getTopWallets,
  getWalletBalance,
  noteSocialMilestone,
  postDigest,
  recordAgentExecution,
  toScoreInput,
} from "./chain/contracts.js";
import {fetchRecentPosts} from "./social/twitter.js";
import {scanWallet, type OnChainScan} from "./onchain/scan.js";
import {analyzeClusters, generateDigest, scoreContent} from "./tasks.js";
import {scoreWallet} from "./scoring/algorithm.js";
import type {
  AdvocateMetrics,
  BuilderMetrics,
  CommunityMetrics,
  UserMetrics,
  WalletScoreContext,
  WalletScoreResult,
} from "./scoring/types.js";
import {buildCandidateClusters, type InteractionEdge, type WalletNode} from "./scoring/antigaming.js";
import type {ClusterAction} from "./prompts/antigaming.js";
import type {ContentScore, SocialPostInput} from "./prompts/content.js";
import type {DigestInput} from "./prompts/digest.js";
import {pinDigest} from "./ipfs.js";
import {currentDayIndex, shouldPostDigest} from "./scheduler.js";
import {log} from "./logger.js";

const EMPTY_ADVOCATE: AdvocateMetrics = {
  posts: [],
  weeklyStreakWeeks: 0,
  spamPostCount: 0,
  purchasedEngagement: false,
};

export interface CycleState {
  lastDigestDayIndex: number;
}

export interface CycleResult {
  jobId: Hex;
  walletsProcessed: number;
  flaggedWallets: number;
  digestPosted: boolean;
}

/** Run one full six hour cycle. Every external step is wrapped so a single failure
 *  does not abort the whole cycle. Failures are logged and the cycle continues. */
export async function runCycle(config: AgentConfig, clients: ChainClients, state: CycleState): Promise<CycleResult> {
  const startedAt = Date.now();
  const jobId = keccak256(toHex(`ritual-mind-cycle-${startedAt}`));
  const attestationHash = keccak256(toHex(`ritual-mind-attestation-${jobId}-${startedAt}`));
  log.info("cycle started", {jobId, agent: clients.account.address});

  // Step 1. Social fetch.
  const posts = await safe(() => fetchRecentPosts(clients, config), [] as SocialPostInput[], "social fetch");

  // Step 2. Content scoring.
  const contentScores = await safe(() => scoreContent(clients, config, posts), [] as ContentScore[], "content scoring");
  const advocateByHandle = aggregateAdvocate(posts, contentScores);

  // Step 3. On chain scan of the known wallets.
  const walletList = await safe(
    () => getTopWallets(clients, config.contracts.walletRegistry, BigInt(config.cycle.maxBatch)),
    [] as readonly Address[],
    "top wallets",
  );

  const results: WalletScoreResult[] = [];
  const nodes: WalletNode[] = [];
  for (const wallet of walletList) {
    const profile = await readProfile(clients, config, wallet);
    if (profile === null) continue;
    const scan = await safe(() => scanWallet(clients, config, wallet), defaultScan(wallet), "wallet scan");
    const attestationsGiven = await safe(() => readAttestationsGiven(clients, config, wallet), 0, "attestations given");
    const ageDaysValue = ageDays(profile.registeredAt, startedAt);
    const ctx = composeContext(profile, scan, attestationsGiven, advocateByHandle, ageDaysValue, startedAt);
    results.push(scoreWallet(ctx));
    nodes.push({wallet, ageDays: ageDaysValue, funder: null});
  }

  // Step 4. Anti gaming. Heuristics surface candidates, the LLM judges, the oracle acts.
  let flaggedWallets = 0;
  const edges: InteractionEdge[] = [];
  const candidates = buildCandidateClusters(nodes, edges);
  if (candidates.length > 0) {
    const summary = {
      walletCount: nodes.length,
      edgeCount: edges.length,
      newWalletCount: nodes.filter((node) => node.ageDays < 7).length,
      medianWalletAgeDays: median(nodes.map((node) => node.ageDays)),
    };
    const judgment = await safe(() => analyzeClusters(clients, config, candidates, summary), {clusters: []}, "anti gaming");
    let clusterId = 0n;
    for (const cluster of judgment.clusters) {
      const severity = actionToSeverity(cluster.action);
      const members = cluster.wallets.filter((value): value is Address => isAddress(value));
      if (severity >= 2 && cluster.confidence >= 0.8 && members.length > 0) {
        await safe(
          () =>
            flagCluster(
              clients,
              config.contracts.scoreOracle,
              clusterId,
              members,
              severity,
              cluster.rationale.slice(0, 120),
              attestationHash,
            ),
          undefined,
          "flag cluster",
        );
        flaggedWallets += members.length;
        clusterId += 1n;
      }
    }
  }

  // Step 5. Score compute and batch submit, chunked to the oracle batch limit.
  const inputs = results.map((result) => toScoreInput(result, attestationHash));
  for (const batch of chunkArray(inputs, config.cycle.maxBatch)) {
    if (batch.length > 0) {
      await safe(() => batchSubmitScores(clients, config.contracts.scoreOracle, batch), undefined, "batch submit");
    }
  }

  // Step 6. Daily digest, once per UTC day.
  let digestPosted = false;
  if (shouldPostDigest(state.lastDigestDayIndex, startedAt)) {
    const digestInput = buildDigestInput(results, nodes, flaggedWallets, contentScores, posts, startedAt);
    const digest = await safe(() => generateDigest(clients, config, digestInput), null, "digest");
    if (digest !== null) {
      const dayIndex = currentDayIndex(startedAt);
      const cid = await safe(() => pinDigest(clients, config, digest, dayIndex), "", "pin digest");
      await safe(
        () => postDigest(clients, config.contracts.scoreOracle, BigInt(dayIndex), cid, attestationHash),
        undefined,
        "post digest",
      );
      state.lastDigestDayIndex = dayIndex;
      digestPosted = true;
    }
  }

  // Step 7. Self maintenance and cycle record.
  await selfMaintain(clients, config);
  await safe(
    () => recordAgentExecution(clients, config.contracts.scoreOracle, jobId, BigInt(results.length), attestationHash),
    undefined,
    "record execution",
  );

  log.info("cycle complete", {
    jobId,
    walletsProcessed: results.length,
    flaggedWallets,
    digestPosted,
    durationMs: Date.now() - startedAt,
  });
  return {jobId, walletsProcessed: results.length, flaggedWallets, digestPosted};
}

// --- Types and helpers ---

interface WalletProfileRead {
  wallet: Address;
  twitterHandle: string;
  builderScore: number;
  advocateScore: number;
  communityScore: number;
  userScore: number;
  composite: number;
  globalRank: number;
  registeredAt: bigint;
  lastUpdated: bigint;
  isVerifiedBuilder: boolean;
  weeklyStreak: number;
  attestationsReceived: number;
  registrationNumber: number;
  flagSeverity: number;
}

async function safe<T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    log.error(`${label} failed`, {error: error instanceof Error ? error.message : String(error)});
    return fallback;
  }
}

async function readProfile(
  clients: ChainClients,
  config: AgentConfig,
  wallet: Address,
): Promise<WalletProfileRead | null> {
  try {
    const profile = await clients.publicClient.readContract({
      address: config.contracts.walletRegistry,
      abi: WALLET_REGISTRY_ABI,
      functionName: "getProfile",
      args: [wallet],
    });
    return profile as WalletProfileRead;
  } catch {
    return null;
  }
}

async function readAttestationsGiven(clients: ChainClients, config: AgentConfig, wallet: Address): Promise<number> {
  const count = await clients.publicClient.readContract({
    address: config.contracts.walletRegistry,
    abi: WALLET_REGISTRY_ABI,
    functionName: "attestationsGivenCount",
    args: [wallet],
  });
  return Number(count);
}

function defaultScan(wallet: Address): OnChainScan {
  return {
    wallet,
    balanceWei: 0n,
    balanceRitual: 0,
    txCount: 0,
    contractsDeployed: 0,
    uniquePrecompilesUsed: 0,
    precompilesUsedAsUser: 0,
    uniqueDappsUsed: 0,
    firstActivityUnix: 0,
    lastActivityUnix: 0,
  };
}

function aggregateAdvocate(posts: SocialPostInput[], scores: ContentScore[]): Map<string, AdvocateMetrics> {
  const scoreById = new Map(scores.map((score) => [score.id, score]));
  const byAuthor = new Map<string, AdvocateMetrics>();
  for (const post of posts) {
    const score = scoreById.get(post.id);
    if (score === undefined) continue;
    const key = post.author.toLowerCase();
    const entry = byAuthor.get(key) ?? {posts: [], weeklyStreakWeeks: 0, spamPostCount: 0, purchasedEngagement: false};
    entry.posts.push({
      qualityScore: score.overallQuality,
      impressions: post.impressions,
      retweetedByRitual: false,
      isOriginalThread: post.isThread,
      hasVideo: post.hasVideo,
      isRepetitiveLowEffort: score.isRepetitiveLowEffort,
    });
    if (score.isSpam) entry.spamPostCount += 1;
    if (score.isPurchasedEngagement) entry.purchasedEngagement = true;
    byAuthor.set(key, entry);
  }
  return byAuthor;
}

function composeContext(
  profile: WalletProfileRead,
  scan: OnChainScan,
  attestationsGiven: number,
  advocateByHandle: Map<string, AdvocateMetrics>,
  ageDaysValue: number,
  nowMs: number,
): WalletScoreContext {
  const handle = profile.twitterHandle.toLowerCase();
  const advocateBase = handle.length > 0 ? (advocateByHandle.get(handle) ?? EMPTY_ADVOCATE) : EMPTY_ADVOCATE;
  const advocate: AdvocateMetrics = {...advocateBase, weeklyStreakWeeks: profile.weeklyStreak};

  const nowSec = Math.floor(nowMs / 1000);
  const idle = scan.lastActivityUnix > 0 && nowSec - scan.lastActivityUnix > 14 * 86_400;

  const builder: BuilderMetrics = {
    contractsDeployed: scan.contractsDeployed,
    uniquePrecompilesUsed: scan.uniquePrecompilesUsed,
    hasActiveRegisteredProject: false,
    externalWalletsUsingProject: 0,
    codeQualityScore: 0,
    testnetContributions: 0,
    abandonedContracts: idle && scan.contractsDeployed > 0 ? 1 : 0,
    duplicateClones: 0,
  };

  const community: CommunityMetrics = {
    attestationsFromVerifiedBuilders: 0,
    attestationsFromRegularWallets: profile.attestationsReceived,
    attestationsGiven,
    forumContributions: 0,
    debugHelps: 0,
    mutualAttestationRings: 0,
    selfAttestations: 0,
  };

  const user: UserMetrics = {
    uniqueDappsUsed: scan.uniqueDappsUsed,
    weeksActive: Math.min(Math.floor(ageDaysValue / 7), 10),
    ritualBalance: scan.balanceRitual,
    precompilesUsedAsUser: scan.precompilesUsedAsUser,
    botLikePattern: false,
  };

  return {
    wallet: profile.wallet,
    walletAgeDays: ageDaysValue,
    isVerifiedBuilder: profile.isVerifiedBuilder,
    builder,
    advocate,
    community,
    user,
  };
}

function buildDigestInput(
  results: WalletScoreResult[],
  nodes: WalletNode[],
  flagged: number,
  contentScores: ContentScore[],
  posts: SocialPostInput[],
  nowMs: number,
): DigestInput {
  const topMovers = [...results]
    .filter((result) => result.composite > 0)
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 5)
    .map((result) => ({wallet: result.wallet, compositeDelta: result.composite}));

  const postById = new Map(posts.map((post) => [post.id, post]));
  const notableContent = [...contentScores]
    .sort((a, b) => b.overallQuality - a.overallQuality)
    .slice(0, 3)
    .map((score) => ({author: postById.get(score.id)?.author ?? "unknown", summary: score.reasoning}));

  return {
    dayIndex: currentDayIndex(nowMs),
    newWallets: nodes.filter((node) => node.ageDays < 1).length,
    totalWallets: results.length,
    topMovers,
    trendingProjects: [],
    notableContent,
    flaggedClusters: flagged,
  };
}

async function selfMaintain(clients: ChainClients, config: AgentConfig): Promise<void> {
  const balance = await safe(() => getWalletBalance(clients, clients.account.address), 0n, "balance check");
  if (balance < config.cycle.lowFundsThresholdWei) {
    log.warn("RitualWallet balance is low", {balance: formatRitual(balance)});
    await safe(
      () => noteSocialMilestone(clients, config.contracts.scoreOracle, clients.account.address, "LOW_FUNDS", balance),
      undefined,
      "low funds note",
    );
    const nativeBalance = await safe(
      () => clients.publicClient.getBalance({address: clients.account.address}),
      0n,
      "native balance",
    );
    if (nativeBalance > config.cycle.depositAmountWei) {
      await safe(() => depositToRitualWallet(clients, config), undefined, "ritual wallet top up");
    }
  }
}

function actionToSeverity(action: ClusterAction): number {
  switch (action) {
    case "freeze":
      return 3;
    case "restrict":
      return 2;
    case "watch":
      return 1;
    case "none":
      return 0;
    default:
      return 0;
  }
}

function ageDays(registeredAt: bigint, nowMs: number): number {
  if (registeredAt === 0n) return 0;
  const registeredMs = Number(registeredAt) * 1000;
  return Math.max(0, Math.floor((nowMs - registeredMs) / 86_400_000));
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lower = sorted[mid - 1] ?? sorted[0] ?? 0;
  const upper = sorted[mid] ?? 0;
  return sorted.length % 2 === 0 ? (lower + upper) / 2 : upper;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
