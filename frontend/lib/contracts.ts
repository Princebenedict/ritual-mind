import {
  createPublicClient,
  custom,
  decodeEventLog,
  isAddress,
  type Abi,
  type Address,
  type Hex,
} from "viem";
import {ritualChain, CONTRACTS, explorerAddress, explorerTx} from "./chain";
import {getLatestBlockNumber} from "./rpc";
import {BADGES, badgeById} from "./badges";
import {shortAddress} from "./utils";
import type {Evidence, Project, ProjectCategory, ScoreSnapshot, WalletProfile} from "./types";

/**
 * Real on chain read layer for the deployed Ritual Mind contracts. Every value here is read
 * with viem from the WalletRegistry, ProjectRegistry, BadgeNFT, and ActivityEmitter through
 * the same origin /api/rpc proxy, so nothing is invented, estimated, or randomized. The
 * client is read only. There is no wallet client and no signing anywhere in the app.
 *
 * The contracts are deployed but freshly so, so most reads return empty results today. That
 * is surfaced honestly by the UI ("No wallets registered yet") rather than filled with a
 * placeholder. Reads throw on RPC failure so callers can show a loading or unavailable state.
 */

/** viem transport that speaks JSON-RPC to the same origin proxy, which forwards to the
 *  official Ritual RPC. Using the proxy avoids browser CORS and keeps the endpoint server
 *  side, exactly as the existing rpc.ts data path does. */
async function proxyRequest({method, params}: {method: string; params?: unknown[]}): Promise<unknown> {
  const response = await fetch("/api/rpc", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({jsonrpc: "2.0", id: 1, method, params: params ?? []}),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed with status ${response.status}`);
  }
  const json = (await response.json()) as {result?: unknown; error?: {message: string}};
  if (json.error !== undefined) {
    throw new Error(`RPC ${method}: ${json.error.message}`);
  }
  return json.result;
}

export const publicClient = createPublicClient({
  chain: ritualChain,
  transport: custom({request: proxyRequest}),
});

/** True only when the four Ritual Mind contract addresses are configured in the environment. */
export function contractsConfigured(): boolean {
  return (
    isAddress(CONTRACTS.walletRegistry) &&
    isAddress(CONTRACTS.projectRegistry) &&
    isAddress(CONTRACTS.badgeNFT) &&
    isAddress(CONTRACTS.activityEmitter)
  );
}

// --- ABIs. Only the members this app reads, transcribed from the deployed interfaces. ---

const WALLET_REGISTRY_ABI = [
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
    name: "getScoreHistory",
    stateMutability: "view",
    inputs: [{name: "wallet", type: "address"}],
    outputs: [
      {
        type: "tuple[]",
        components: [
          {name: "composite", type: "uint16"},
          {name: "builderScore", type: "uint16"},
          {name: "advocateScore", type: "uint16"},
          {name: "communityScore", type: "uint16"},
          {name: "userScore", type: "uint16"},
          {name: "timestamp", type: "uint64"},
          {name: "attestationHash", type: "bytes32"},
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
  {type: "function", name: "isRegistered", stateMutability: "view", inputs: [{name: "wallet", type: "address"}], outputs: [{type: "bool"}]},
  {type: "function", name: "isTwitterVerified", stateMutability: "view", inputs: [{name: "wallet", type: "address"}], outputs: [{type: "bool"}]},
  {type: "function", name: "totalRegistered", stateMutability: "view", inputs: [], outputs: [{type: "uint256"}]},
  {
    type: "event",
    name: "ScoreUpdated",
    inputs: [
      {name: "wallet", type: "address", indexed: true},
      {name: "oldComposite", type: "uint16", indexed: false},
      {name: "newComposite", type: "uint16", indexed: false},
      {name: "builderDelta", type: "int256", indexed: false},
      {name: "advocateDelta", type: "int256", indexed: false},
      {name: "communityDelta", type: "int256", indexed: false},
      {name: "userDelta", type: "int256", indexed: false},
      {name: "attestationHash", type: "bytes32", indexed: false},
    ],
  },
] as const satisfies Abi;

const PROJECT_REGISTRY_ABI = [
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
    name: "getTrending",
    stateMutability: "view",
    inputs: [{name: "count", type: "uint256"}],
    outputs: [
      {name: "contracts", type: "address[]"},
      {name: "scores", type: "uint256[]"},
    ],
  },
  {type: "function", name: "totalProjects", stateMutability: "view", inputs: [], outputs: [{type: "uint256"}]},
] as const satisfies Abi;

const BADGE_NFT_ABI = [
  {type: "function", name: "hasBadge", stateMutability: "view", inputs: [{name: "wallet", type: "address"}, {name: "badgeId", type: "uint8"}], outputs: [{type: "bool"}]},
  {type: "function", name: "badgeCount", stateMutability: "view", inputs: [{name: "wallet", type: "address"}], outputs: [{type: "uint256"}]},
  {type: "function", name: "earnedAt", stateMutability: "view", inputs: [{name: "wallet", type: "address"}, {name: "badgeId", type: "uint8"}], outputs: [{type: "uint64"}]},
] as const satisfies Abi;

/** ActivityEmitter events, the single event source for the live feed. Exported so the feed
 *  hook can decode logs delivered over the WebSocket subscription. */
export const ACTIVITY_EMITTER_ABI = [
  {type: "event", name: "ContractDeployed", inputs: [{name: "deployer", type: "address", indexed: true}, {name: "contractAddress", type: "address", indexed: true}, {name: "timestamp", type: "uint256", indexed: false}]},
  {type: "event", name: "ProjectRegistered", inputs: [{name: "contractAddress", type: "address", indexed: true}, {name: "deployer", type: "address", indexed: true}, {name: "name", type: "string", indexed: false}, {name: "category", type: "uint8", indexed: false}]},
  {type: "event", name: "ScoreUpdated", inputs: [{name: "wallet", type: "address", indexed: true}, {name: "composite", type: "uint256", indexed: false}, {name: "delta", type: "int256", indexed: false}, {name: "attestationHash", type: "bytes32", indexed: false}]},
  {type: "event", name: "AttestationGiven", inputs: [{name: "from", type: "address", indexed: true}, {name: "to", type: "address", indexed: true}, {name: "weight", type: "uint8", indexed: false}]},
  {type: "event", name: "BadgeEarned", inputs: [{name: "wallet", type: "address", indexed: true}, {name: "badgeId", type: "uint8", indexed: true}]},
  {type: "event", name: "AgentExecution", inputs: [{name: "jobId", type: "bytes32", indexed: true}, {name: "walletsProcessed", type: "uint256", indexed: false}, {name: "attestationHash", type: "bytes32", indexed: false}]},
  {type: "event", name: "SocialMilestone", inputs: [{name: "wallet", type: "address", indexed: true}, {name: "kind", type: "string", indexed: false}, {name: "value", type: "uint256", indexed: false}]},
  {type: "event", name: "DigestPosted", inputs: [{name: "dayIndex", type: "uint256", indexed: true}, {name: "ipfsCid", type: "string", indexed: false}, {name: "attestationHash", type: "bytes32", indexed: false}]},
  {type: "event", name: "WalletFlagged", inputs: [{name: "wallet", type: "address", indexed: true}, {name: "severity", type: "uint8", indexed: false}, {name: "reason", type: "string", indexed: false}]},
] as const satisfies Abi;

const CATEGORIES: ProjectCategory[] = [
  "DEFI",
  "GOVERNANCE",
  "AGENT",
  "MARKETPLACE",
  "SOCIAL",
  "INFRASTRUCTURE",
  "GAMING",
  "OTHER",
];

// --- Reads ---

const walletRegistry = () => ({address: CONTRACTS.walletRegistry as Address, abi: WALLET_REGISTRY_ABI}) as const;
const projectRegistry = () => ({address: CONTRACTS.projectRegistry as Address, abi: PROJECT_REGISTRY_ABI}) as const;
const badgeNFT = () => ({address: CONTRACTS.badgeNFT as Address, abi: BADGE_NFT_ABI}) as const;

/** The Ritual RPC rejects eth_getLogs over very wide block ranges (a fromBlock of 0 fails).
 *  Ranges up to about a hundred thousand blocks are accepted, so all log queries stay at or
 *  below this width and page backwards when a wider history is needed. */
const MAX_LOG_RANGE = 90_000;

/** Which soulbound badges a wallet holds, with the block time each was earned. Real reads
 *  against BadgeNFT: one hasBadge check per badge, then earnedAt for the ones held. */
export async function getWalletBadges(address: Address): Promise<{ids: number[]; earnedAt: Record<number, number>}> {
  const held = await Promise.all(
    BADGES.map((badge) =>
      publicClient
        .readContract({...badgeNFT(), functionName: "hasBadge", args: [address, badge.id]})
        .then((has) => (has ? badge.id : 0)),
    ),
  );
  const ids = held.filter((id) => id > 0);
  const times = await Promise.all(
    ids.map((id) =>
      publicClient.readContract({...badgeNFT(), functionName: "earnedAt", args: [address, id]}).then((t) => [id, Number(t)] as const),
    ),
  );
  return {ids, earnedAt: Object.fromEntries(times)};
}

/** The full on chain profile for a wallet, or null when the address has never registered.
 *  Unregistered addresses return a zero struct from getProfile, so registration is checked
 *  first to keep the empty state honest rather than showing a fabricated zero score. */
export async function getWalletProfile(address: Address): Promise<WalletProfile | null> {
  if (!contractsConfigured() || !isAddress(address)) return null;

  const registered = await publicClient.readContract({...walletRegistry(), functionName: "isRegistered", args: [address]});
  if (!registered) return null;

  const [raw, twitterVerified, badges] = await Promise.all([
    publicClient.readContract({...walletRegistry(), functionName: "getProfile", args: [address]}),
    publicClient.readContract({...walletRegistry(), functionName: "isTwitterVerified", args: [address]}),
    getWalletBadges(address),
  ]);

  const handle = raw.twitterHandle.length > 0 ? raw.twitterHandle : null;
  return {
    address: raw.wallet,
    twitterHandle: handle,
    twitterVerified,
    builder: raw.builderScore,
    advocate: raw.advocateScore,
    community: raw.communityScore,
    user: raw.userScore,
    composite: raw.composite,
    globalRank: raw.globalRank,
    registeredAt: Number(raw.registeredAt),
    lastUpdated: Number(raw.lastUpdated),
    isVerifiedBuilder: raw.isVerifiedBuilder,
    weeklyStreak: raw.weeklyStreak,
    attestationsReceived: raw.attestationsReceived,
    // Not stored in the on chain profile struct; never fabricated. Left at zero and never
    // surfaced as a real value by the UI.
    attestationsGiven: 0,
    registrationNumber: raw.registrationNumber,
    flagSeverity: raw.flagSeverity,
    badges: badges.ids,
    badgeEarnedAt: badges.earnedAt,
    history: [],
    contractsDeployed: 0,
    precompilesUsed: 0,
  };
}

/** Append only, immutable score history for a wallet, each point carrying its attestation
 *  hash. Empty until the agent has scored this wallet at least once. */
export async function getScoreHistory(address: Address): Promise<ScoreSnapshot[]> {
  if (!contractsConfigured() || !isAddress(address)) return [];
  const raw = await publicClient.readContract({...walletRegistry(), functionName: "getScoreHistory", args: [address]});
  return raw.map((point) => ({
    timestamp: Number(point.timestamp),
    composite: point.composite,
    builder: point.builderScore,
    advocate: point.advocateScore,
    community: point.communityScore,
    user: point.userScore,
    attestationHash: point.attestationHash,
  }));
}

/** The transaction that last wrote this wallet's score, for citation as evidence. Reads the
 *  WalletRegistry ScoreUpdated logs for the wallet and returns the most recent one with its
 *  transaction hash, block, and time. Returns null when the wallet has no score updates or
 *  the RPC declines the log range. */
export async function getLatestScoreEvidence(address: Address): Promise<Evidence | null> {
  if (!contractsConfigured() || !isAddress(address)) return null;
  const registry = CONTRACTS.walletRegistry as Address;
  try {
    // Scores update every cycle, so the most recent write is within the last window. One
    // bounded getLogs keeps within the RPC range limit.
    const head = await getLatestBlockNumber();
    const logs = await publicClient.getLogs({
      address: registry,
      event: WALLET_REGISTRY_ABI[6],
      args: {wallet: address},
      fromBlock: BigInt(Math.max(0, head - MAX_LOG_RANGE)),
      toBlock: BigInt(head),
    });
    const latest = logs[logs.length - 1];
    if (latest === undefined) return null;
    const block = await publicClient.getBlock({blockNumber: latest.blockNumber});
    return {
      contract: registry,
      explorer: explorerTx(latest.transactionHash),
      txHash: latest.transactionHash,
      blockNumber: Number(latest.blockNumber),
      timestamp: Number(block.timestamp),
      attestationHash: latest.args.attestationHash,
    };
  } catch {
    return null;
  }
}

/** Number of wallets that have ever registered. Drives the leaderboard empty state. */
export async function getTotalRegistered(): Promise<number> {
  if (!contractsConfigured()) return 0;
  const total = await publicClient.readContract({...walletRegistry(), functionName: "totalRegistered"});
  return Number(total);
}

/** The top wallets by composite score, already ranked by the contract, as full profiles.
 *  Empty until wallets are registered and scored. */
export async function getTopProfiles(count = 50): Promise<WalletProfile[]> {
  if (!contractsConfigured()) return [];
  const [wallets] = await publicClient.readContract({...walletRegistry(), functionName: "getTopWallets", args: [BigInt(count)]});
  const profiles = await Promise.all(wallets.map((wallet) => getWalletProfile(wallet)));
  return profiles.filter((profile): profile is WalletProfile => profile !== null);
}

function mapProject(raw: {
  contractAddress: Address;
  deployer: Address;
  name: string;
  description: string;
  category: number;
  url: string;
  repoUrl: string;
  weeklyActiveWallets: number;
  totalTxns: number;
  healthScore: number;
  growthRate: number;
  communityScore: number;
  isVerified: boolean;
  isActive: boolean;
  registeredAt: bigint;
  lastUpdated: bigint;
}): Project {
  return {
    address: raw.contractAddress,
    deployer: raw.deployer,
    name: raw.name,
    description: raw.description,
    category: CATEGORIES[raw.category] ?? "OTHER",
    url: raw.url,
    repoUrl: raw.repoUrl,
    weeklyActiveWallets: raw.weeklyActiveWallets,
    totalTxns: raw.totalTxns,
    healthScore: raw.healthScore,
    growthRate: raw.growthRate,
    communityScore: raw.communityScore,
    isVerified: raw.isVerified,
    isActive: raw.isActive,
    registeredAt: Number(raw.registeredAt),
    // Not stored on chain as arrays; never fabricated.
    topContributors: [],
    wauHistory: [],
  };
}

/** Number of projects registered. Drives the projects empty state. */
export async function getTotalProjects(): Promise<number> {
  if (!contractsConfigured()) return 0;
  const total = await publicClient.readContract({...projectRegistry(), functionName: "totalProjects"});
  return Number(total);
}

/** Trending projects by the contract's own ranking, as full project records. Empty until
 *  projects are registered. */
export async function getTrendingProjects(count = 50): Promise<Project[]> {
  if (!contractsConfigured()) return [];
  const [contracts] = await publicClient.readContract({...projectRegistry(), functionName: "getTrending", args: [BigInt(count)]});
  const projects = await Promise.all(
    contracts.map((address) => publicClient.readContract({...projectRegistry(), functionName: "getProject", args: [address]}).then(mapProject)),
  );
  return projects;
}

/** A single project by its contract address, or null when it is not registered. */
export async function getProject(address: Address): Promise<Project | null> {
  if (!contractsConfigured() || !isAddress(address)) return null;
  const raw = await publicClient.readContract({...projectRegistry(), functionName: "getProject", args: [address]});
  // An unregistered project returns a zero struct with the zero address.
  if (raw.contractAddress === "0x0000000000000000000000000000000000000000") return null;
  return mapProject(raw);
}

/** Evidence pointing at a contract address on the explorer. */
export function contractEvidence(address: Address): Evidence {
  return {contract: address, explorer: explorerAddress(address)};
}

// --- ActivityEmitter events, the single event source for the live feed. ---

/** One decoded Ritual Mind event, ready to render in the feed. Timestamp is attached by the
 *  caller from the block the event was emitted in. */
export interface RmEvent {
  id: string;
  kind: string;
  txHash: Hex;
  blockNumber: number;
  logIndex: number;
  label: string;
  detail: string;
  wallet: Address | null;
}

interface RawLog {
  data: Hex;
  topics: [] | [signature: Hex, ...args: Hex[]];
  transactionHash: Hex | null;
  blockNumber: bigint | null;
  logIndex: number | null;
}

/** Decode a single ActivityEmitter log into a feed event, or null when it is not one of our
 *  events or is a pending (unmined) log. Uses viem to decode against the real event ABI. */
export function decodeActivityLog(log: RawLog): RmEvent | null {
  if (log.transactionHash === null || log.blockNumber === null || log.logIndex === null) return null;
  let decoded: {eventName: string; args: Record<string, unknown>};
  try {
    decoded = decodeEventLog({abi: ACTIVITY_EMITTER_ABI, data: log.data, topics: log.topics}) as typeof decoded;
  } catch {
    return null;
  }
  const args = decoded.args;
  const base = {
    id: `${log.transactionHash}-${log.logIndex}`,
    txHash: log.transactionHash,
    blockNumber: Number(log.blockNumber),
    logIndex: log.logIndex,
    kind: decoded.eventName,
  };
  const wallet = (args.wallet as Address | undefined) ?? null;

  switch (decoded.eventName) {
    case "ScoreUpdated": {
      const delta = Number(args.delta as bigint);
      const deltaText = delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta})` : "";
      return {...base, wallet, label: "Score updated", detail: `composite ${String(args.composite)}${deltaText}`};
    }
    case "ContractDeployed":
      return {
        ...base,
        wallet: (args.deployer as Address) ?? null,
        label: "Contract deployed",
        detail: shortAddress(args.contractAddress as Address),
      };
    case "ProjectRegistered":
      return {...base, wallet: (args.deployer as Address) ?? null, label: "Project registered", detail: String(args.name)};
    case "AttestationGiven":
      return {
        ...base,
        wallet: (args.from as Address) ?? null,
        label: "Attestation given",
        detail: `${shortAddress(args.from as Address)} to ${shortAddress(args.to as Address)}`,
      };
    case "BadgeEarned": {
      const id = Number(args.badgeId as bigint);
      return {...base, wallet, label: "Badge earned", detail: badgeById(id)?.title ?? `Badge #${id}`};
    }
    case "AgentExecution":
      return {...base, wallet: null, label: "Agent cycle", detail: `${String(args.walletsProcessed)} wallets scored`};
    case "SocialMilestone":
      return {...base, wallet, label: "Social milestone", detail: `${String(args.kind)}: ${String(args.value)}`};
    case "DigestPosted":
      return {...base, wallet: null, label: "Daily digest posted", detail: `day ${String(args.dayIndex)}`};
    case "WalletFlagged":
      return {...base, wallet, label: "Wallet flagged", detail: String(args.reason)};
    default:
      return null;
  }
}

/** Recent Ritual Mind events across a bounded window ending at the chain head, newest first.
 *  Used by the intel and social pages. The window keeps the eth_getLogs range within limits;
 *  it is far wider than any realistic backlog on a fresh deployment. */
export async function getRecentRitualMindEvents(windowBlocks = 250_000): Promise<RmEvent[]> {
  if (!contractsConfigured()) return [];
  const latest = await getLatestBlockNumber();
  const events = await getActivityEmitterEvents(Math.max(0, latest - windowBlocks), latest);
  return events.sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
}

/** Fetch and decode ActivityEmitter events across a block range, in one eth_getLogs. Empty
 *  until the agent emits events. Returns [] on any RPC error so the feed degrades gracefully. */
export async function getActivityEmitterEvents(fromBlock: number, toBlock: number): Promise<RmEvent[]> {
  if (!contractsConfigured() || toBlock < fromBlock) return [];
  const address = CONTRACTS.activityEmitter as Address;
  const events: RmEvent[] = [];
  try {
    // Page backwards in bounded windows so a wide range stays within the RPC getLogs limit.
    let end = toBlock;
    while (end >= fromBlock) {
      const start = Math.max(fromBlock, end - MAX_LOG_RANGE + 1);
      const logs = await publicClient.getLogs({address, fromBlock: BigInt(start), toBlock: BigInt(end)});
      for (const log of logs) {
        const event = decodeActivityLog(log);
        if (event !== null) events.push(event);
      }
      if (start === fromBlock) break;
      end = start - 1;
    }
  } catch {
    // Return whatever was gathered before a transient RPC error.
  }
  return events;
}

export type {Address, Hex};
