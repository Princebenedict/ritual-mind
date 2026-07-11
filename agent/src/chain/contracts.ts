import {formatEther, parseEther, type Address, type Hex} from "viem";
import {ritualChain, SYSTEM_CONTRACTS, type AgentConfig} from "../config.js";
import type {ChainClients} from "./client.js";
import {SCORE_ORACLE_ABI, WALLET_REGISTRY_ABI, PROJECT_REGISTRY_ABI, RITUAL_WALLET_ABI} from "./abis.js";
import type {WalletScoreResult} from "../scoring/types.js";

const DEFAULT_FEES = {
  maxFeePerGas: 30_000_000_000n,
  maxPriorityFeePerGas: 2_000_000_000n,
} as const;

export interface ScoreInputStruct {
  wallet: Address;
  builderScore: number;
  advocateScore: number;
  communityScore: number;
  userScore: number;
  weeklyStreak: number;
  contractsDeployed: number;
  precompilesUsed: number;
  attestationsGiven: number;
  isVerifiedBuilder: boolean;
  attestationHash: Hex;
}

/** Turn a computed wallet result into the exact struct the oracle expects. */
export function toScoreInput(result: WalletScoreResult, attestationHash: Hex): ScoreInputStruct {
  return {
    wallet: result.wallet,
    builderScore: result.scores.builder,
    advocateScore: result.scores.advocate,
    communityScore: result.scores.community,
    userScore: result.scores.user,
    weeklyStreak: result.weeklyStreak,
    contractsDeployed: result.contractsDeployed,
    precompilesUsed: result.precompilesUsed,
    attestationsGiven: result.attestationsGiven,
    isVerifiedBuilder: result.isVerifiedBuilder,
    attestationHash,
  };
}

export async function batchSubmitScores(
  clients: ChainClients,
  oracle: Address,
  inputs: ScoreInputStruct[],
): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: oracle,
    abi: SCORE_ORACLE_ABI,
    functionName: "batchSubmit",
    args: [inputs],
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export async function flagCluster(
  clients: ChainClients,
  oracle: Address,
  clusterId: bigint,
  wallets: Address[],
  severity: number,
  reason: string,
  attestationHash: Hex,
): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: oracle,
    abi: SCORE_ORACLE_ABI,
    functionName: "flagCluster",
    args: [clusterId, wallets, severity, reason, attestationHash],
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export async function recordAgentExecution(
  clients: ChainClients,
  oracle: Address,
  jobId: Hex,
  walletsProcessed: bigint,
  attestationHash: Hex,
): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: oracle,
    abi: SCORE_ORACLE_ABI,
    functionName: "recordAgentExecution",
    args: [jobId, walletsProcessed, attestationHash],
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export async function postDigest(
  clients: ChainClients,
  oracle: Address,
  dayIndex: bigint,
  ipfsCid: string,
  attestationHash: Hex,
): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: oracle,
    abi: SCORE_ORACLE_ABI,
    functionName: "postDigest",
    args: [dayIndex, ipfsCid, attestationHash],
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export async function noteSocialMilestone(
  clients: ChainClients,
  oracle: Address,
  wallet: Address,
  kind: string,
  value: bigint,
): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: oracle,
    abi: SCORE_ORACLE_ABI,
    functionName: "noteSocialMilestone",
    args: [wallet, kind, value],
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export async function confirmTwitter(clients: ChainClients, oracle: Address, wallet: Address): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: oracle,
    abi: SCORE_ORACLE_ABI,
    functionName: "confirmTwitter",
    args: [wallet],
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export async function getTopWallets(
  clients: ChainClients,
  registry: Address,
  count: bigint,
): Promise<readonly Address[]> {
  const [wallets] = await clients.publicClient.readContract({
    address: registry,
    abi: WALLET_REGISTRY_ABI,
    functionName: "getTopWallets",
    args: [count],
  });
  return wallets;
}

export async function totalProjects(clients: ChainClients, projectRegistry: Address): Promise<bigint> {
  return clients.publicClient.readContract({
    address: projectRegistry,
    abi: PROJECT_REGISTRY_ABI,
    functionName: "totalProjects",
  });
}

// --- RitualWallet self maintenance ---

export async function getWalletBalance(clients: ChainClients, account: Address): Promise<bigint> {
  return clients.publicClient.readContract({
    address: SYSTEM_CONTRACTS.RITUAL_WALLET,
    abi: RITUAL_WALLET_ABI,
    functionName: "balanceOf",
    args: [account],
  });
}

export async function depositToRitualWallet(clients: ChainClients, config: AgentConfig): Promise<Hex> {
  const hash = await clients.walletClient.writeContract({
    account: clients.account,
    chain: ritualChain,
    address: SYSTEM_CONTRACTS.RITUAL_WALLET,
    abi: RITUAL_WALLET_ABI,
    functionName: "deposit",
    args: [config.cycle.lockDurationBlocks],
    value: config.cycle.depositAmountWei,
    ...DEFAULT_FEES,
  });
  await clients.publicClient.waitForTransactionReceipt({hash});
  return hash;
}

export function formatRitual(wei: bigint): string {
  return formatEther(wei);
}

export function ritual(amount: string): bigint {
  return parseEther(amount);
}
