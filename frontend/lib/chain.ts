import {defineChain} from "viem";

/** RPC endpoints. Both the NEXT_PUBLIC_RPC_URL / NEXT_PUBLIC_WS_URL names used in
 *  .env.local and the older NEXT_PUBLIC_RITUAL_* names are accepted, falling back to the
 *  official public endpoints so the app works with either configuration. */
export const RPC_HTTP_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? process.env.NEXT_PUBLIC_RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org";
export const RPC_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_RITUAL_WS_URL ?? "wss://rpc.ritualfoundation.org/ws";

/** Ritual Testnet, chain id 1979. Single source of chain configuration for the app. */
export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Testnet",
  nativeCurrency: {name: "RITUAL", symbol: "RITUAL", decimals: 18},
  rpcUrls: {
    default: {
      http: [RPC_HTTP_URL],
      webSocket: [RPC_WS_URL],
    },
  },
  blockExplorers: {
    default: {name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org"},
  },
});

export const EXPLORER_URL = "https://explorer.ritualfoundation.org";

export function explorerAddress(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}

export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}

export function explorerBlock(blockNumber: number): string {
  return `${EXPLORER_URL}/block/${blockNumber}`;
}

/** System contracts watched for live agent lifecycle. Fixed on Ritual Chain. */
export const SYSTEM_CONTRACTS = {
  RITUAL_WALLET: "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948",
  ASYNC_JOB_TRACKER: "0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5",
  TEE_SERVICE_REGISTRY: "0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F",
  SCHEDULER: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B",
  SECRETS_ACL: "0xf9BF1BC8A3e79B9EBeD0fa2Db70D0513fecE32FD",
  ASYNC_DELIVERY: "0x5A16214fF555848411544b005f7Ac063742f39F6",
} as const;

/** Ritual Mind contract addresses. Read from the environment, never hardcoded. */
export const CONTRACTS = {
  activityEmitter: (process.env.NEXT_PUBLIC_ACTIVITY_EMITTER ?? "") as string,
  walletRegistry: (process.env.NEXT_PUBLIC_WALLET_REGISTRY ?? "") as string,
  projectRegistry: (process.env.NEXT_PUBLIC_PROJECT_REGISTRY ?? "") as string,
  badgeNFT: (process.env.NEXT_PUBLIC_BADGE_NFT ?? "") as string,
  scoreOracle: (process.env.NEXT_PUBLIC_SCORE_ORACLE ?? "") as string,
} as const;

/** True when the app is wired to deployed contracts. Otherwise it runs on demo data. */
export const LIVE_MODE = CONTRACTS.walletRegistry.length === 42;
