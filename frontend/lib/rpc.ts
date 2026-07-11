import {formatEther, isAddress, type Address} from "viem";

/**
 * Real Ritual Network data layer. Every value here comes from the official Ritual RPC via
 * the same origin proxy at /api/rpc. Nothing is mocked, estimated, or randomized. Each
 * function throws on failure so the UI can show a loading or unavailable state instead of
 * inventing a value. Block timestamps on Ritual are milliseconds.
 */

const RPC_PROXY = "/api/rpc";

interface RpcResponse<T> {
  result?: T;
  error?: {message: string};
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(RPC_PROXY, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({jsonrpc: "2.0", id: 1, method, params}),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} failed with status ${response.status}`);
  }
  const json = (await response.json()) as RpcResponse<T>;
  if (json.error !== undefined) {
    throw new Error(`RPC ${method}: ${json.error.message}`);
  }
  if (json.result === undefined) {
    throw new Error(`RPC ${method} returned no result`);
  }
  return json.result;
}

interface BatchCall {
  method: string;
  params: unknown[];
}

/** One HTTP round trip for many JSON-RPC calls. Results are returned in request order. */
async function rpcBatch<T>(calls: BatchCall[]): Promise<(T | null)[]> {
  if (calls.length === 0) return [];
  const body = calls.map((call, index) => ({jsonrpc: "2.0", id: index, method: call.method, params: call.params}));
  const response = await fetch(RPC_PROXY, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`RPC batch failed with status ${response.status}`);
  }
  const json = (await response.json()) as Array<RpcResponse<T> & {id: number}>;
  if (!Array.isArray(json)) {
    throw new Error("RPC batch returned a non array response");
  }
  const ordered: (T | null)[] = new Array<T | null>(calls.length).fill(null);
  for (const item of json) {
    if (typeof item.id === "number" && item.error === undefined && item.result !== undefined) {
      ordered[item.id] = item.result;
    }
  }
  return ordered;
}

function toHex(value: bigint): string {
  return `0x${value.toString(16)}`;
}

function required<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error(`${name} is unavailable from the Ritual RPC`);
  }
  return value;
}

// --- Known addresses for labeling, from the official Ritual documentation ---

const PRECOMPILES: Record<string, string> = {
  "0x0000000000000000000000000000000000000800": "ONNX",
  "0x0000000000000000000000000000000000000801": "HTTP",
  "0x0000000000000000000000000000000000000802": "LLM",
  "0x0000000000000000000000000000000000000803": "JQ",
  "0x0000000000000000000000000000000000000805": "Long HTTP",
  "0x0000000000000000000000000000000000000806": "ZK",
  "0x0000000000000000000000000000000000000807": "FHE",
  "0x000000000000000000000000000000000000080c": "Sovereign agent",
  "0x0000000000000000000000000000000000000818": "Image",
  "0x0000000000000000000000000000000000000819": "Audio",
  "0x000000000000000000000000000000000000081a": "Video",
  "0x000000000000000000000000000000000000081b": "DKMS",
  "0x0000000000000000000000000000000000000820": "Persistent agent",
};

const SYSTEM_CONTRACTS: Record<string, string> = {
  "0x532f0df0896f353d8c3dd8cc134e8129da2a3948": "RitualWallet",
  "0xc069ffca0389f44eca2c626e55491b0ab045aef5": "AsyncJobTracker",
  "0x9644e8562ce0fe12b4deec4163c064a8862bf47f": "TEEServiceRegistry",
  "0x56e776bae2dd60664b69bd5f865f1180ffb7d58b": "Scheduler",
  "0xf9bf1bc8a3e79b9ebed0fa2db70d0513fece32fd": "SecretsAccessControl",
  "0x5a16214ff555848411544b005f7ac063742f39f6": "AsyncDelivery",
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export type TxKind = "scheduled" | "commitment" | "settlement" | "creation" | "transfer" | "call";

export interface ChainTx {
  hash: string;
  from: string;
  to: string | null;
  valueWei: bigint;
  typeNum: number;
  kind: TxKind;
  label: string;
  precompile: string | null;
  blockNumber: number;
  timestampMs: number;
}

interface RawTx {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  type: string;
  precompileAddress?: string;
}

interface RawBlock {
  number: string;
  timestamp: string;
  transactions: RawTx[];
}

interface RawHeader {
  number: string;
  timestamp: string;
}

function labelTx(raw: RawTx, blockNumber: number, timestampMs: number): ChainTx {
  const typeNum = Number.parseInt(raw.type, 16);
  const precompileAddr =
    raw.precompileAddress !== undefined && raw.precompileAddress.toLowerCase() !== ZERO_ADDRESS
      ? raw.precompileAddress.toLowerCase()
      : null;
  const precompile = precompileAddr !== null ? (PRECOMPILES[precompileAddr] ?? "Precompile") : null;
  const toName = raw.to !== null ? SYSTEM_CONTRACTS[raw.to.toLowerCase()] : undefined;

  let kind: TxKind;
  let label: string;
  if (typeNum === 0x10) {
    kind = "scheduled";
    label = precompile !== null ? `Scheduled ${precompile} call` : "Scheduled call";
  } else if (typeNum === 0x11) {
    kind = "commitment";
    label = precompile !== null ? `${precompile} job committed` : "Async commitment";
  } else if (typeNum === 0x12) {
    kind = "settlement";
    label = precompile !== null ? `${precompile} job settled` : "Async settlement";
  } else if (raw.to === null) {
    kind = "creation";
    label = "Contract deployed";
  } else if (BigInt(raw.value) > 0n) {
    kind = "transfer";
    label = "Value transfer";
  } else {
    kind = "call";
    label = toName !== undefined ? `Call to ${toName}` : "Contract call";
  }

  return {
    hash: raw.hash,
    from: raw.from,
    to: raw.to,
    valueWei: BigInt(raw.value),
    typeNum,
    kind,
    label,
    precompile,
    blockNumber,
    timestampMs,
  };
}

// --- Public data functions ---

export interface NetworkStatus {
  chainId: number;
  blockNumber: number;
  gasPriceWei: bigint;
  blockTimeMs: number;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  const batch = await rpcBatch<string>([
    {method: "eth_chainId", params: []},
    {method: "eth_blockNumber", params: []},
    {method: "eth_gasPrice", params: []},
  ]);
  const chainHex = required(batch[0], "Chain id");
  const blockHex = required(batch[1], "Block number");
  const gasHex = required(batch[2], "Gas price");

  const latest = BigInt(blockHex);
  const span = latest > 20n ? 20n : 1n;
  const headers = await rpcBatch<RawHeader>([
    {method: "eth_getBlockByNumber", params: [toHex(latest), false]},
    {method: "eth_getBlockByNumber", params: [toHex(latest - span), false]},
  ]);
  const head = headers[0];
  const prior = headers[1];
  const blockTimeMs =
    head !== null && head !== undefined && prior !== null && prior !== undefined
      ? (Number(BigInt(head.timestamp)) - Number(BigInt(prior.timestamp))) / Number(span)
      : 0;
  return {
    chainId: Number.parseInt(chainHex, 16),
    blockNumber: Number(latest),
    gasPriceWei: BigInt(gasHex),
    blockTimeMs: Math.max(0, Math.round(blockTimeMs)),
  };
}

/** Recent real transactions, gathered by batching the latest blocks in one request. */
export async function getRecentActivity(blockCount = 20): Promise<ChainTx[]> {
  const blockHex = await rpc<string>("eth_blockNumber", []);
  const latest = BigInt(blockHex);
  const calls: BatchCall[] = [];
  for (let i = 0; i < blockCount; i += 1) {
    const n = latest - BigInt(i);
    if (n < 0n) break;
    calls.push({method: "eth_getBlockByNumber", params: [toHex(n), true]});
  }
  const blocks = await rpcBatch<RawBlock>(calls);

  const txs: ChainTx[] = [];
  for (const block of blocks) {
    if (block === null) continue;
    const blockNumber = Number(BigInt(block.number));
    const timestampMs = Number(BigInt(block.timestamp));
    for (const raw of block.transactions) {
      txs.push(labelTx(raw, blockNumber, timestampMs));
    }
  }
  txs.sort((a, b) => b.blockNumber - a.blockNumber || a.hash.localeCompare(b.hash));
  return txs;
}

export async function getLatestBlockNumber(): Promise<number> {
  const hex = await rpc<string>("eth_blockNumber", []);
  return Number(BigInt(hex));
}

/** Real transactions for a specific set of block numbers, batched in one request. */
export async function getActivityForBlocks(blockNumbers: number[]): Promise<ChainTx[]> {
  if (blockNumbers.length === 0) return [];
  const calls: BatchCall[] = blockNumbers.map((n) => ({
    method: "eth_getBlockByNumber",
    params: [toHex(BigInt(n)), true],
  }));
  const blocks = await rpcBatch<RawBlock>(calls);
  const txs: ChainTx[] = [];
  for (const block of blocks) {
    if (block === null) continue;
    const blockNumber = Number(BigInt(block.number));
    const timestampMs = Number(BigInt(block.timestamp));
    for (const raw of block.transactions) {
      txs.push(labelTx(raw, blockNumber, timestampMs));
    }
  }
  txs.sort((a, b) => b.blockNumber - a.blockNumber || a.hash.localeCompare(b.hash));
  return txs;
}

/** Read only eth_call through the proxy. Used by the reputation code path once the
 *  Ritual Mind contracts are deployed and their addresses are configured. */
export async function ethCall(to: string, data: `0x${string}`): Promise<`0x${string}`> {
  return rpc<`0x${string}`>("eth_call", [{to, data}, "latest"]);
}

export interface AddressOverview {
  address: Address;
  isContract: boolean;
  contractName: string | null;
  balanceWei: bigint;
  balanceRitual: string;
  outgoingTxCount: number;
  codeSizeBytes: number;
}

export async function getAddressOverview(address: string): Promise<AddressOverview> {
  if (!isAddress(address)) {
    throw new Error("Not a valid address");
  }
  const checksummed = address as Address;
  const [balanceHex, nonceHex, code] = await Promise.all([
    rpc<string>("eth_getBalance", [checksummed, "latest"]),
    rpc<string>("eth_getTransactionCount", [checksummed, "latest"]),
    rpc<string>("eth_getCode", [checksummed, "latest"]),
  ]);
  const codeSizeBytes = code === "0x" ? 0 : (code.length - 2) / 2;
  const balanceWei = BigInt(balanceHex);
  return {
    address: checksummed,
    isContract: codeSizeBytes > 0,
    contractName: SYSTEM_CONTRACTS[checksummed.toLowerCase()] ?? null,
    balanceWei,
    balanceRitual: formatEther(balanceWei),
    outgoingTxCount: Number(BigInt(nonceHex)),
    codeSizeBytes,
  };
}

export function isValidAddress(value: string): boolean {
  return isAddress(value);
}

export function shortHash(hash: string, lead = 8, tail = 6): string {
  if (hash.length <= lead + tail) return hash;
  return `${hash.slice(0, lead)}...${hash.slice(-tail)}`;
}
