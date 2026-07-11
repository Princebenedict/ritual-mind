import "dotenv/config";
import {defineChain, type Address, type Hex} from "viem";

/**
 * Central configuration for the Ritual Mind agent. System contract and precompile
 * addresses are fixed constants on Ritual Chain. The five Ritual Mind contract
 * addresses are read from the environment and are never hardcoded.
 */

// --- Fixed chain constants ---

export const CHAIN_ID = 1979;

export const ritualChain = defineChain({
  id: CHAIN_ID,
  name: "Ritual Testnet",
  nativeCurrency: {name: "RITUAL", symbol: "RITUAL", decimals: 18},
  rpcUrls: {
    default: {
      http: [process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org"],
      webSocket: [process.env.RITUAL_WS_URL ?? "wss://rpc.ritualfoundation.org/ws"],
    },
  },
  blockExplorers: {
    default: {name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org"},
  },
});

export const SYSTEM_CONTRACTS = {
  RITUAL_WALLET: "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948",
  ASYNC_JOB_TRACKER: "0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5",
  TEE_SERVICE_REGISTRY: "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F",
  SCHEDULER: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B",
  SECRETS_ACCESS_CONTROL: "0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD",
  ASYNC_DELIVERY: "0x5A16214fF555848411544b005f7Ac063742f39F6",
} as const satisfies Record<string, Address>;

export const PRECOMPILES = {
  HTTP_CALL: "0x0000000000000000000000000000000000000801",
  LLM: "0x0000000000000000000000000000000000000802",
  JQ: "0x0000000000000000000000000000000000000803",
} as const satisfies Record<string, Address>;

export const CAPABILITY = {
  HTTP_CALL: 0,
  LLM: 1,
} as const;

/** The only model confirmed live on the Ritual gateway at build time. */
export const LLM_MODEL = "zai-org/GLM-4.7-FP8";

// --- Environment helpers ---

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required environment variable ${name}. See agent/.env.example.`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.length === 0 ? fallback : value;
}

function asAddress(value: string, name: string): Address {
  if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
    throw new Error(`Environment variable ${name} is not a valid address: ${value}`);
  }
  return value as Address;
}

function asHex(value: string, name: string): Hex {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`Environment variable ${name} is not valid hex: ${value}`);
  }
  return value as Hex;
}

/** Load and validate the full agent configuration. Throws on missing required values. */
export function loadConfig(): AgentConfig {
  return {
    rpcUrl: optional("RITUAL_RPC_URL", "https://rpc.ritualfoundation.org"),
    wsUrl: optional("RITUAL_WS_URL", "wss://rpc.ritualfoundation.org/ws"),
    agentPrivateKey: asHex(required("AGENT_PRIVATE_KEY"), "AGENT_PRIVATE_KEY"),
    contracts: {
      scoreOracle: asAddress(required("SCORE_ORACLE_ADDRESS"), "SCORE_ORACLE_ADDRESS"),
      walletRegistry: asAddress(required("WALLET_REGISTRY_ADDRESS"), "WALLET_REGISTRY_ADDRESS"),
      projectRegistry: asAddress(required("PROJECT_REGISTRY_ADDRESS"), "PROJECT_REGISTRY_ADDRESS"),
      activityEmitter: asAddress(required("ACTIVITY_EMITTER_ADDRESS"), "ACTIVITY_EMITTER_ADDRESS"),
    },
    social: {
      twitterBearerToken: optional("TWITTER_BEARER_TOKEN", ""),
      twitterSearchTerms: optional("TWITTER_SEARCH_TERMS", "ritual chain,ritualfnd,#BuildOnRitual")
        .split(",")
        .map((term) => term.trim())
        .filter((term) => term.length > 0),
    },
    explorer: {
      apiBaseUrl: optional("EXPLORER_API_URL", "https://explorer.ritualfoundation.org/api"),
    },
    ipfs: {
      pinataJwt: optional("PINATA_JWT", ""),
      pinataBaseUrl: optional("PINATA_API_URL", "https://api.pinata.cloud"),
    },
    cycle: {
      intervalMs: Number(optional("CYCLE_INTERVAL_MS", String(6 * 60 * 60 * 1000))),
      lowFundsThresholdWei: BigInt(optional("LOW_FUNDS_THRESHOLD_WEI", String(5n * 10n ** 17n))),
      depositAmountWei: BigInt(optional("DEPOSIT_AMOUNT_WEI", String(2n * 10n ** 18n))),
      lockDurationBlocks: BigInt(optional("LOCK_DURATION_BLOCKS", "100000")),
      maxBatch: Number(optional("MAX_BATCH", "100")),
    },
  };
}

export interface AgentConfig {
  rpcUrl: string;
  wsUrl: string;
  agentPrivateKey: Hex;
  contracts: {
    scoreOracle: Address;
    walletRegistry: Address;
    projectRegistry: Address;
    activityEmitter: Address;
  };
  social: {
    twitterBearerToken: string;
    twitterSearchTerms: string[];
  };
  explorer: {
    apiBaseUrl: string;
  };
  ipfs: {
    pinataJwt: string;
    pinataBaseUrl: string;
  };
  cycle: {
    intervalMs: number;
    lowFundsThresholdWei: bigint;
    depositAmountWei: bigint;
    lockDurationBlocks: bigint;
    maxBatch: number;
  };
}
