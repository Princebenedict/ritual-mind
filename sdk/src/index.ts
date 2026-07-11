import type {Account, Address, Hash, WalletClient} from "viem";
import {makePublicClient, ritualChain} from "./client.js";
import {
  ACTIVITY_EMITTER_ABI,
  BADGE_NFT_ABI,
  BADGE_TITLES,
  CATEGORY_BY_INDEX,
  PROJECT_REGISTRY_ABI,
  WALLET_REGISTRY_ABI,
} from "./abis.js";
import type {
  Badge,
  ProjectCategory,
  ProjectMetrics,
  RegisterProjectParams,
  RitualMindConfig,
  Score,
} from "./types.js";

export * from "./types.js";
export {ritualChain, makePublicClient} from "./client.js";

const CATEGORY_INDEX: Record<ProjectCategory, number> = {
  DEFI: 0,
  GOVERNANCE: 1,
  AGENT: 2,
  MARKETPLACE: 3,
  SOCIAL: 4,
  INFRASTRUCTURE: 5,
  GAMING: 6,
  OTHER: 7,
};

/** Feed events an integrator may emit through an authorized ActivityEmitter writer. */
export type ActivityInput =
  | {type: "contractDeployed"; deployer: Address; contractAddress: Address}
  | {type: "socialMilestone"; wallet: Address; kind: string; value: bigint};

/** The Ritual Mind client surface. */
export interface RitualMind {
  /** Read the full reputation score for a wallet. */
  getScore(wallet: Address): Promise<Score>;
  /** Whether the wallet holds verified builder status. */
  isVerifiedBuilder(wallet: Address): Promise<boolean>;
  /** The soulbound badges a wallet has earned, with earned timestamps. */
  getBadges(wallet: Address): Promise<Badge[]>;
  /** Read live metrics for a registered project. */
  getProjectMetrics(address: Address): Promise<ProjectMetrics>;
  /** The top wallets by composite, ready for a leaderboard. */
  getTopWallets(count: number): Promise<Score[]>;
  /** Register a project. Requires a wallet client to send the transaction. */
  registerProject(params: RegisterProjectParams, walletClient: WalletClient): Promise<Hash>;
  /** Emit a feed event. The sending address must be an authorized ActivityEmitter writer. */
  emitActivity(input: ActivityInput, walletClient: WalletClient): Promise<Hash>;
}

/**
 * Create a Ritual Mind client bound to your deployed contract addresses. Reads use a
 * viem public client. Writes require a viem wallet client with a connected account.
 *
 * @example
 * const mind = createRitualMind({walletRegistry: "0x..."});
 * const score = await mind.getScore("0xWALLET");
 */
export function createRitualMind(config: RitualMindConfig): RitualMind {
  const publicClient = makePublicClient(config.rpcUrl);

  const requireAddress = (value: Address | undefined, name: string): Address => {
    if (value === undefined) {
      throw new Error(`The ${name} address is required for this call. Pass it to createRitualMind.`);
    }
    return value;
  };

  const requireAccount = (walletClient: WalletClient): Account => {
    if (walletClient.account === undefined) {
      throw new Error("The wallet client must have a connected account.");
    }
    return walletClient.account;
  };

  async function getScore(wallet: Address): Promise<Score> {
    const profile = await publicClient.readContract({
      address: config.walletRegistry,
      abi: WALLET_REGISTRY_ABI,
      functionName: "getProfile",
      args: [wallet],
    });
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
    };
  }

  async function isVerifiedBuilder(wallet: Address): Promise<boolean> {
    const profile = await publicClient.readContract({
      address: config.walletRegistry,
      abi: WALLET_REGISTRY_ABI,
      functionName: "getProfile",
      args: [wallet],
    });
    return profile.isVerifiedBuilder;
  }

  async function getBadges(wallet: Address): Promise<Badge[]> {
    const badgeNFT = requireAddress(config.badgeNFT, "badgeNFT");
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = await Promise.all(
      ids.map(async (id) => {
        const held = await publicClient.readContract({
          address: badgeNFT,
          abi: BADGE_NFT_ABI,
          functionName: "hasBadge",
          args: [wallet, id],
        });
        if (!held) return null;
        const earnedAt = await publicClient.readContract({
          address: badgeNFT,
          abi: BADGE_NFT_ABI,
          functionName: "earnedAt",
          args: [wallet, id],
        });
        const badge: Badge = {id, title: BADGE_TITLES[id] ?? `Badge ${id}`, earnedAt: Number(earnedAt)};
        return badge;
      }),
    );
    return results.filter((badge): badge is Badge => badge !== null);
  }

  async function getProjectMetrics(address: Address): Promise<ProjectMetrics> {
    const projectRegistry = requireAddress(config.projectRegistry, "projectRegistry");
    const project = await publicClient.readContract({
      address: projectRegistry,
      abi: PROJECT_REGISTRY_ABI,
      functionName: "getProject",
      args: [address],
    });
    const category = (CATEGORY_BY_INDEX[project.category] ?? "OTHER") as ProjectCategory;
    return {
      address: project.contractAddress,
      deployer: project.deployer,
      name: project.name,
      description: project.description,
      category,
      weeklyActiveWallets: project.weeklyActiveWallets,
      totalTxns: project.totalTxns,
      healthScore: project.healthScore,
      growthRate: project.growthRate,
      communityScore: project.communityScore,
      isVerified: project.isVerified,
      isActive: project.isActive,
    };
  }

  async function getTopWallets(count: number): Promise<Score[]> {
    const [wallets] = await publicClient.readContract({
      address: config.walletRegistry,
      abi: WALLET_REGISTRY_ABI,
      functionName: "getTopWallets",
      args: [BigInt(count)],
    });
    return Promise.all(wallets.map((wallet) => getScore(wallet)));
  }

  async function registerProject(params: RegisterProjectParams, walletClient: WalletClient): Promise<Hash> {
    const projectRegistry = requireAddress(config.projectRegistry, "projectRegistry");
    return walletClient.writeContract({
      account: requireAccount(walletClient),
      chain: ritualChain,
      address: projectRegistry,
      abi: PROJECT_REGISTRY_ABI,
      functionName: "register",
      args: [
        params.contractAddress,
        params.name,
        params.description,
        CATEGORY_INDEX[params.category],
        params.url,
        params.repoUrl,
      ],
    });
  }

  async function emitActivity(input: ActivityInput, walletClient: WalletClient): Promise<Hash> {
    const activityEmitter = requireAddress(config.activityEmitter, "activityEmitter");
    const account = requireAccount(walletClient);
    if (input.type === "contractDeployed") {
      return walletClient.writeContract({
        account,
        chain: ritualChain,
        address: activityEmitter,
        abi: ACTIVITY_EMITTER_ABI,
        functionName: "emitContractDeployed",
        args: [input.deployer, input.contractAddress],
      });
    }
    return walletClient.writeContract({
      account,
      chain: ritualChain,
      address: activityEmitter,
      abi: ACTIVITY_EMITTER_ABI,
      functionName: "emitSocialMilestone",
      args: [input.wallet, input.kind, input.value],
    });
  }

  return {
    getScore,
    isVerifiedBuilder,
    getBadges,
    getProjectMetrics,
    getTopWallets,
    registerProject,
    emitActivity,
  };
}
