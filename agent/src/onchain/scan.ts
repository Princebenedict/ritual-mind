import {
  createPublicClient,
  formatEther,
  getContractAddress,
  http,
  type Address,
  type PublicClient,
} from "viem";
import {ritualChain, type AgentConfig} from "../config.js";
import type {ChainClients} from "../chain/client.js";
import {log} from "../logger.js";

/**
 * Step 3 of the cycle. Read a wallet's on chain activity directly from the Ritual
 * RPC (chain 1979) with viem. Ritual exposes no public transaction index: the block
 * explorer has no REST API, the Otterscan (`ots_*`) and `trace_filter` namespaces are
 * disabled on the public endpoint, and historical state is pruned. So metrics are
 * derived two ways:
 *
 *  - Cheap and exact from head state: native balance and transaction count.
 *  - Deployed contracts from deterministic CREATE addresses (sender + nonce), which
 *    needs no historical scan and survives state pruning.
 *  - Precompile / dApp usage and last activity from a bounded scan of recent block
 *    bodies. The window is indexed once and shared across every wallet in the cycle,
 *    and the index is extended forward between cycles instead of rebuilt.
 *
 * Every chain quantity (wei balances, block numbers, block timestamps) is kept as a
 * BigInt. Large values are never coerced to Number.
 */

export interface OnChainScan {
  wallet: Address;
  balanceWei: bigint;
  balanceRitual: number;
  txCount: number;
  contractsDeployed: number;
  uniquePrecompilesUsed: number;
  precompilesUsedAsUser: number;
  uniqueDappsUsed: number;
  firstActivityUnix: number;
  lastActivityUnix: number;
}

// Ritual enshrined precompiles occupy the 0x0800..0x08FF address band: 0x0801 HTTP,
// 0x0802 LLM, 0x0803 JQ, 0x080C Sovereign Agent, 0x0820 Persistent Agent, and so on.
const PRECOMPILE_LO = 0x0800n;
const PRECOMPILE_HI = 0x08ffn;

function precompileIdOf(to: Address | null | undefined): bigint | null {
  if (to === null || to === undefined) return null;
  const value = BigInt(to);
  return value >= PRECOMPILE_LO && value <= PRECOMPILE_HI ? value : null;
}

/** Ritual block timestamps are Unix milliseconds. Convert to seconds as a BigInt divide. */
function msToUnixSeconds(timestampMs: bigint): number {
  return Number(timestampMs / 1000n);
}

// --- Shared recent-activity index -------------------------------------------------

interface WalletActivity {
  /** Distinct precompile ids (0x08xx) this wallet sent transactions to. */
  precompiles: Set<string>;
  /** Distinct non-precompile, non-creation destinations; classified to contracts later. */
  dappCandidates: Set<string>;
  firstTimestampMs: bigint;
  lastTimestampMs: bigint;
  firstBlock: bigint;
  lastBlock: bigint;
}

interface RecentIndex {
  fromBlock: bigint;
  toBlock: bigint;
  activity: Map<string, WalletActivity>;
}

// Persist across cycles for the lifetime of the agent process.
let sharedIndex: RecentIndex | null = null;
let scanClient: PublicClient | null = null;
// Address -> "has code" cache, so dApp classification is not repeated across wallets.
const contractCodeCache = new Map<string, boolean>();

/** Read-only viem client for the low-volume head-state reads (block number, getCode).
 *  Bulk block bodies are fetched with raw batched JSON-RPC instead (see fetchBlockBatch):
 *  viem's batch transport coalesces every concurrent call into a single in-flight
 *  request, which serializes the scan; raw batching keeps many requests in flight. */
function getScanClient(config: AgentConfig): PublicClient {
  if (scanClient === null) {
    scanClient = createPublicClient({chain: ritualChain, transport: http(config.rpcUrl)});
  }
  return scanClient;
}

interface RawTx {
  from?: string;
  to?: string | null;
}
interface RawBlock {
  number: string;
  timestamp: string;
  transactions: RawTx[];
}

/** Fetch a contiguous run of block bodies in one JSON-RPC batch request. Returns the
 *  blocks aligned to the requested order (null for any that failed to decode). The
 *  public RPC 403s a generic User-Agent, so a curl-style header is sent explicitly. */
async function fetchBlockBatch(rpcUrl: string, numbers: bigint[]): Promise<(RawBlock | null)[]> {
  const payload = numbers.map((n, id) => ({
    jsonrpc: "2.0",
    id,
    method: "eth_getBlockByNumber",
    params: ["0x" + n.toString(16), true],
  }));

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: {"content-type": "application/json", "user-agent": "curl/8.0"},
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
      const json = (await response.json()) as {id: number; result?: RawBlock | null}[];
      const out: (RawBlock | null)[] = new Array<RawBlock | null>(numbers.length).fill(null);
      for (const entry of json) {
        if (entry && typeof entry.id === "number" && entry.id < out.length && entry.result) {
          out[entry.id] = entry.result;
        }
      }
      return out;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("block batch request failed");
}

function newActivity(timestampMs: bigint, block: bigint): WalletActivity {
  return {
    precompiles: new Set(),
    dappCandidates: new Set(),
    firstTimestampMs: timestampMs,
    lastTimestampMs: timestampMs,
    firstBlock: block,
    lastBlock: block,
  };
}

function recordTx(
  index: RecentIndex,
  from: string,
  to: Address | null | undefined,
  block: bigint,
  timestampMs: bigint,
): void {
  let activity = index.activity.get(from);
  if (activity === undefined) {
    activity = newActivity(timestampMs, block);
    index.activity.set(from, activity);
  } else {
    if (block < activity.firstBlock) {
      activity.firstBlock = block;
      activity.firstTimestampMs = timestampMs;
    }
    if (block > activity.lastBlock) {
      activity.lastBlock = block;
      activity.lastTimestampMs = timestampMs;
    }
  }
  // Contract creation (to === null) is counted separately via CREATE derivation.
  if (to === null || to === undefined) return;
  const precompileId = precompileIdOf(to);
  if (precompileId !== null) {
    activity.precompiles.add(precompileId.toString());
  } else {
    activity.dappCandidates.add(to.toLowerCase());
  }
}

/** Fetch block bodies over [from, to] and fold every transaction into the index.
 *  Blocks are pulled in JSON-RPC batches of batchSize, with concurrency batches in
 *  flight. Capped at maxBlocksPerScan; when capped, the most recent blocks are kept. */
async function scanRange(
  config: AgentConfig,
  index: RecentIndex,
  from: bigint,
  to: bigint,
): Promise<void> {
  if (to < from) return;
  const cap = config.scan.maxBlocksPerScan;
  let start = from;
  if (to - from + 1n > cap) {
    start = to - cap + 1n;
    if (start > index.fromBlock) index.fromBlock = start;
  }

  const batchSize = BigInt(Math.max(1, config.scan.batchSize));
  const batchStarts: bigint[] = [];
  for (let base = start; base <= to; base += batchSize) batchStarts.push(base);

  let nextBatch = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = nextBatch;
      if (i >= batchStarts.length) break;
      nextBatch = i + 1;
      const base = batchStarts[i]!;
      const numbers: bigint[] = [];
      for (let n = base; n < base + batchSize && n <= to; n++) numbers.push(n);
      let blocks: (RawBlock | null)[];
      try {
        blocks = await fetchBlockBatch(config.rpcUrl, numbers);
      } catch {
        continue; // whole batch failed after retries; skip it rather than abort the scan
      }
      for (const block of blocks) {
        if (block === null) continue;
        const blockNumber = BigInt(block.number);
        const timestampMs = BigInt(block.timestamp);
        for (const tx of block.transactions) {
          const sender = tx.from?.toLowerCase();
          if (sender === undefined) continue;
          recordTx(index, sender, (tx.to ?? null) as Address | null, blockNumber, timestampMs);
        }
      }
    }
  };

  const workers = Math.max(1, config.scan.concurrency);
  await Promise.all(Array.from({length: workers}, () => worker()));
}

/** Build or extend the shared recent-block index up to the current chain head. */
async function ensureRecentIndex(config: AgentConfig): Promise<RecentIndex> {
  const client = getScanClient(config);
  const tip = await client.getBlockNumber();
  const window = config.scan.windowBlocks;
  const desiredFrom = tip > window ? tip - window + 1n : 0n;

  const current = sharedIndex;
  const canReuse =
    current !== null && current.fromBlock <= desiredFrom && tip - current.fromBlock <= window * 2n;

  if (canReuse && current !== null) {
    if (tip > current.toBlock) {
      await scanRange(config, current, current.toBlock + 1n, tip);
      current.toBlock = tip;
    }
    return current;
  }

  const index: RecentIndex = {fromBlock: desiredFrom, toBlock: desiredFrom - 1n, activity: new Map()};
  const startedAt = Date.now();
  await scanRange(config, index, desiredFrom, tip);
  index.toBlock = tip;
  sharedIndex = index;
  log.info("recent activity index built", {
    fromBlock: index.fromBlock.toString(),
    toBlock: index.toBlock.toString(),
    wallets: index.activity.size,
    durationMs: Date.now() - startedAt,
  });
  return index;
}

// --- Head-state derivations -------------------------------------------------------

/** Count contracts deployed by this wallet via CREATE. A CREATE at nonce n yields the
 *  deterministic address getContractAddress({from, nonce: n}); if that address holds
 *  code, nonce n was a contract-creation transaction. This is exact and needs no
 *  historical scan, so it works despite state pruning. Bounded by maxDeriveNonce. */
async function countDeployedContracts(
  client: PublicClient,
  config: AgentConfig,
  wallet: Address,
  nonce: number,
): Promise<number> {
  const limit = Math.min(nonce, config.scan.maxDeriveNonce);
  if (limit <= 0) return 0;

  let count = 0;
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const n = next;
      if (n >= limit) break;
      next = n + 1;
      const address = getContractAddress({from: wallet, nonce: BigInt(n)});
      try {
        const code = await client.getCode({address});
        if (code !== undefined && code !== "0x") count += 1;
      } catch {
        // ignore individual failures; a missing read just means "no contract counted"
      }
    }
  };
  const workers = Math.max(1, config.scan.concurrency);
  await Promise.all(Array.from({length: workers}, () => worker()));
  return count;
}

/** Of the distinct destinations this wallet sent to, count the ones that hold code. A
 *  plain value transfer to an EOA is not a dApp interaction; only contracts count. */
async function countContractDapps(
  client: PublicClient,
  candidates: Set<string>,
  concurrency: number,
): Promise<number> {
  const addresses = [...candidates];
  if (addresses.length === 0) return 0;

  let count = 0;
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const i = next;
      if (i >= addresses.length) break;
      next = i + 1;
      const address = addresses[i]!;
      const cached = contractCodeCache.get(address);
      if (cached !== undefined) {
        if (cached) count += 1;
        continue;
      }
      try {
        const code = await client.getCode({address: address as Address});
        const isContract = code !== undefined && code !== "0x";
        contractCodeCache.set(address, isContract);
        if (isContract) count += 1;
      } catch {
        // leave uncached; a transient failure should not poison the cache
      }
    }
  };
  const workers = Math.max(1, concurrency);
  await Promise.all(Array.from({length: workers}, () => worker()));
  return count;
}

// --- Public entry point -----------------------------------------------------------

export async function scanWallet(
  clients: ChainClients,
  config: AgentConfig,
  wallet: Address,
): Promise<OnChainScan> {
  const client = getScanClient(config);
  const walletKey = wallet.toLowerCase();

  // Exact head-state reads (cheap) plus the shared recent-block index, in parallel.
  const [balanceWei, txCount, index] = await Promise.all([
    clients.publicClient.getBalance({address: wallet}),
    clients.publicClient.getTransactionCount({address: wallet}),
    ensureRecentIndex(config),
  ]);

  const contractsDeployed = await countDeployedContracts(client, config, wallet, txCount);

  const activity = index.activity.get(walletKey);
  let uniquePrecompilesUsed = 0;
  let uniqueDappsUsed = 0;
  let firstActivityUnix = 0;
  let lastActivityUnix = 0;
  if (activity !== undefined) {
    uniquePrecompilesUsed = activity.precompiles.size;
    uniqueDappsUsed = await countContractDapps(client, activity.dappCandidates, config.scan.concurrency);
    firstActivityUnix = msToUnixSeconds(activity.firstTimestampMs);
    lastActivityUnix = msToUnixSeconds(activity.lastTimestampMs);
  }

  return {
    wallet,
    balanceWei,
    balanceRitual: Number(formatEther(balanceWei)),
    txCount,
    contractsDeployed,
    uniquePrecompilesUsed,
    precompilesUsedAsUser: uniquePrecompilesUsed,
    uniqueDappsUsed,
    firstActivityUnix,
    lastActivityUnix,
  };
}
