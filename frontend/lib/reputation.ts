import {decodeFunctionResult, encodeFunctionData, isAddress, type Address} from "viem";
import {CONTRACTS, explorerAddress} from "./chain";
import {ethCall} from "./rpc";

/**
 * Reputation code path. The Ritual Mind contracts are not yet deployed, so this stays
 * dormant. It becomes live automatically the moment NEXT_PUBLIC_WALLET_REGISTRY is set to
 * a deployed address. No other change is needed. Values are read from the real
 * WalletRegistry.getProfile view and carry the contract address as verifiable evidence.
 */

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
] as const;

/** True only when a deployed WalletRegistry address is configured in the environment. */
export function isReputationConfigured(): boolean {
  return isAddress(CONTRACTS.walletRegistry);
}

export interface WalletReputation {
  address: Address;
  twitterHandle: string;
  builder: number;
  advocate: number;
  community: number;
  user: number;
  composite: number;
  globalRank: number;
  isVerifiedBuilder: boolean;
  weeklyStreak: number;
  attestationsReceived: number;
  registrationNumber: number;
  flagSeverity: number;
  registeredAt: number;
  lastUpdated: number;
  /** Verifiable source of this reputation. */
  evidence: {contract: Address; explorer: string};
}

export async function getWalletReputation(address: string): Promise<WalletReputation | null> {
  if (!isReputationConfigured() || !isAddress(address)) {
    return null;
  }
  const registry = CONTRACTS.walletRegistry as Address;
  const data = encodeFunctionData({abi: WALLET_REGISTRY_ABI, functionName: "getProfile", args: [address as Address]});
  const raw = await ethCall(registry, data);
  const profile = decodeFunctionResult({abi: WALLET_REGISTRY_ABI, functionName: "getProfile", data: raw});
  return {
    address: profile.wallet,
    twitterHandle: profile.twitterHandle,
    builder: profile.builderScore,
    advocate: profile.advocateScore,
    community: profile.communityScore,
    user: profile.userScore,
    composite: profile.composite,
    globalRank: profile.globalRank,
    isVerifiedBuilder: profile.isVerifiedBuilder,
    weeklyStreak: profile.weeklyStreak,
    attestationsReceived: profile.attestationsReceived,
    registrationNumber: profile.registrationNumber,
    flagSeverity: profile.flagSeverity,
    registeredAt: Number(profile.registeredAt),
    lastUpdated: Number(profile.lastUpdated),
    evidence: {contract: registry, explorer: explorerAddress(registry)},
  };
}
