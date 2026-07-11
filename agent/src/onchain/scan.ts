import {formatEther, type Address} from "viem";
import type {AgentConfig} from "../config.js";
import {CAPABILITY} from "../config.js";
import type {ChainClients} from "../chain/client.js";
import type {Executor} from "../chain/executors.js";
import {findExecutor} from "../chain/executors.js";
import {callHttp, HTTP_METHOD} from "../precompiles/http.js";
import {log} from "../logger.js";

/**
 * Step 3 of the cycle. Scan a wallet's on chain activity through the HTTP precompile
 * against the block explorer API. The exact endpoint shape follows Blockscout v2. Adapt
 * the field names if the target explorer differs. Precompile interactions are detected
 * by a destination address in the enshrined precompile range.
 */

export interface OnChainScan {
  wallet: Address;
  balanceRitual: number;
  txCount: number;
  contractsDeployed: number;
  uniquePrecompilesUsed: number;
  precompilesUsedAsUser: number;
  uniqueDappsUsed: number;
  lastActivityUnix: number;
}

interface AddressInfo {
  coin_balance?: string;
  transactions_count?: string | number;
}

interface ExplorerTx {
  to?: {hash?: string} | null;
  created_contract?: {hash?: string} | null;
  timestamp?: string;
  method?: string | null;
}

interface TxListResponse {
  items?: ExplorerTx[];
}

const PRECOMPILE_PREFIX = "0x0000000000000000000000000000000000000";

function isPrecompile(addr: string): boolean {
  const lower = addr.toLowerCase();
  if (!lower.startsWith(PRECOMPILE_PREFIX)) return false;
  const suffix = lower.slice(PRECOMPILE_PREFIX.length);
  const value = parseInt(suffix, 16);
  return value >= 0x800 && value <= 0x820;
}

async function getJson<T>(clients: ChainClients, executor: Executor, url: string): Promise<T | null> {
  const response = await callHttp(clients, {
    executor: executor.teeAddress,
    url,
    method: HTTP_METHOD.GET,
    headerKeys: ["Accept"],
    headerValues: ["application/json"],
  });
  if (response.errorMessage.length > 0 || response.statusCode >= 400) {
    log.warn("Explorer request failed", {url, status: response.statusCode, error: response.errorMessage});
    return null;
  }
  try {
    return JSON.parse(response.body) as T;
  } catch {
    return null;
  }
}

export async function scanWallet(clients: ChainClients, config: AgentConfig, wallet: Address): Promise<OnChainScan> {
  const executor = await findExecutor(clients.publicClient, CAPABILITY.HTTP_CALL);
  const base = config.explorer.apiBaseUrl.replace(/\/$/, "");

  const info = await getJson<AddressInfo>(clients, executor, `${base}/v2/addresses/${wallet}`);
  const txList = await getJson<TxListResponse>(clients, executor, `${base}/v2/addresses/${wallet}/transactions`);

  const balanceWei = info?.coin_balance !== undefined ? BigInt(info.coin_balance) : 0n;
  const balanceRitual = Number(formatEther(balanceWei));
  const txCount = info?.transactions_count !== undefined ? Number(info.transactions_count) : 0;

  const precompilesSeen = new Set<string>();
  const dappsSeen = new Set<string>();
  let contractsDeployed = 0;
  let lastActivityUnix = 0;

  for (const tx of txList?.items ?? []) {
    if (tx.created_contract?.hash !== undefined && tx.created_contract.hash !== null) {
      contractsDeployed += 1;
    }
    const toHash = tx.to?.hash;
    if (typeof toHash === "string") {
      if (isPrecompile(toHash)) {
        precompilesSeen.add(toHash.toLowerCase());
      } else {
        dappsSeen.add(toHash.toLowerCase());
      }
    }
    if (tx.timestamp !== undefined) {
      const unix = Math.floor(new Date(tx.timestamp).getTime() / 1000);
      if (unix > lastActivityUnix) lastActivityUnix = unix;
    }
  }

  const uniquePrecompilesUsed = precompilesSeen.size;
  return {
    wallet,
    balanceRitual,
    txCount,
    contractsDeployed,
    uniquePrecompilesUsed,
    precompilesUsedAsUser: uniquePrecompilesUsed,
    uniqueDappsUsed: dappsSeen.size,
    lastActivityUnix,
  };
}
