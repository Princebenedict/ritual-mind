"use client";

import {useEffect, useRef, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
  getActivityForBlocks,
  getAddressOverview,
  getLatestBlockNumber,
  getNetworkStatus,
  getRecentActivity,
  isValidAddress,
  type ChainTx,
} from "./rpc";
import {RPC_WS_URL} from "./chain";
import {
  contractsConfigured,
  getActivityEmitterEvents,
  getLatestScoreEvidence,
  getProfilesForAddresses,
  getProject,
  getRecentRitualMindEvents,
  getScoreHistory,
  getTopProfiles,
  getTotalProjects,
  getTotalRegistered,
  getTrendingProjects,
  getWalletProfile,
  type RmEvent,
} from "./contracts";
import {useDiscovered} from "./discovered";
import type {Address} from "./types";

/**
 * Data hooks. Every hook reads real Ritual Network data. There is no demo or seeded data.
 * Each hook exposes loading and error states so the UI can show a loading indicator or an
 * honest unavailable message instead of a fabricated value.
 */

const WS_URL = RPC_WS_URL;

export function useNetworkStatus() {
  return useQuery({queryKey: ["network-status"], queryFn: getNetworkStatus, refetchInterval: 5000, staleTime: 3000});
}

export function useAddressOverview(address: string) {
  return useQuery({
    queryKey: ["address-overview", address.toLowerCase()],
    queryFn: () => getAddressOverview(address),
    enabled: address.length > 0,
    retry: 1,
    staleTime: 15000,
  });
}

/** Whether the deployed Ritual Mind contracts are configured. */
export {contractsConfigured};
/** Back compat alias used by components that gate the reputation UI. */
export function isReputationConfigured(): boolean {
  return contractsConfigured();
}

/**
 * Real on chain reputation profile for a wallet, read from the deployed WalletRegistry and
 * BadgeNFT via viem. Resolves to null when the wallet has never registered, so the UI can
 * show an honest "not registered" state instead of a fabricated zero score. Enabled only
 * when the contract addresses are configured.
 */
export function useWalletProfile(address: string) {
  return useQuery({
    queryKey: ["wallet-profile", address.toLowerCase()],
    queryFn: () => getWalletProfile(address as Address),
    enabled: contractsConfigured() && isValidAddress(address),
    staleTime: 30000,
  });
}

/** Immutable score history for a wallet. Fetched only once a profile exists. */
export function useScoreHistory(address: string, enabled: boolean) {
  return useQuery({
    queryKey: ["score-history", address.toLowerCase()],
    queryFn: () => getScoreHistory(address as Address),
    enabled: enabled && contractsConfigured() && isValidAddress(address),
    staleTime: 30000,
  });
}

/** The transaction that last wrote this wallet's score, cited as verifiable evidence. */
export function useScoreEvidence(address: string, enabled: boolean) {
  return useQuery({
    queryKey: ["score-evidence", address.toLowerCase()],
    queryFn: () => getLatestScoreEvidence(address as Address),
    enabled: enabled && contractsConfigured() && isValidAddress(address),
    staleTime: 60000,
  });
}

/** Total wallets ever registered. Drives the leaderboard and analytics empty states. */
export function useTotalRegistered() {
  return useQuery({
    queryKey: ["total-registered"],
    queryFn: getTotalRegistered,
    enabled: contractsConfigured(),
    staleTime: 20000,
  });
}

/** The leaderboard: top wallets by composite, already ranked by the WalletRegistry. */
export function useLeaderboard(count = 50) {
  return useQuery({
    queryKey: ["leaderboard", count],
    queryFn: () => getTopProfiles(count),
    enabled: contractsConfigured(),
    staleTime: 30000,
  });
}

/**
 * Live profiles for the wallets this browser has searched ("discovered"). The leaderboard
 * merges these with the contract's top wallets so a searched-and-scored address stays in the
 * ranking going forward, with no registration. Scores are read fresh from the WalletRegistry;
 * any discovered address without a real score is dropped, so nothing here is fabricated.
 */
export function useDiscoveredProfiles() {
  const discovered = useDiscovered();
  return useQuery({
    queryKey: ["discovered-profiles", discovered.join(",")],
    queryFn: () => getProfilesForAddresses(discovered),
    enabled: contractsConfigured() && discovered.length > 0,
    staleTime: 30000,
  });
}

/** Total registered projects. Drives the projects empty state. */
export function useTotalProjects() {
  return useQuery({
    queryKey: ["total-projects"],
    queryFn: getTotalProjects,
    enabled: contractsConfigured(),
    staleTime: 20000,
  });
}

/** Trending projects from the ProjectRegistry, already ranked by the contract. */
export function useProjects(count = 50) {
  return useQuery({
    queryKey: ["projects", count],
    queryFn: () => getTrendingProjects(count),
    enabled: contractsConfigured(),
    staleTime: 30000,
  });
}

/** A single registered project by contract address, or null when not registered. */
export function useProject(address: string) {
  return useQuery({
    queryKey: ["project", address.toLowerCase()],
    queryFn: () => getProject(address as Address),
    enabled: contractsConfigured() && isValidAddress(address),
    staleTime: 30000,
  });
}

/** Recent decoded Ritual Mind events from the ActivityEmitter, newest first. Backs the intel
 *  (DigestPosted) and social (SocialMilestone) pages. Empty until the agent emits events. */
export function useRitualMindEvents() {
  return useQuery({
    queryKey: ["ritual-mind-events"],
    queryFn: () => getRecentRitualMindEvents(),
    enabled: contractsConfigured(),
    staleTime: 30000,
  });
}

export type LiveStatus = "connecting" | "live" | "polling" | "error";

interface NewHeadsMessage {
  params?: {result?: {number?: string}};
}

/**
 * One item in the live feed. Either a real transaction from a Ritual block, or a decoded
 * Ritual Mind event emitted by the ActivityEmitter contract. Both carry the block and time
 * so they interleave in one chronological stream, and both link to the explorer.
 */
export type LiveItem =
  | {type: "tx"; key: string; blockNumber: number; timestampMs: number; tx: ChainTx}
  | {type: "event"; key: string; blockNumber: number; timestampMs: number; logIndex: number; event: RmEvent};

const toTxItem = (tx: ChainTx): LiveItem => ({
  type: "tx",
  key: tx.hash,
  blockNumber: tx.blockNumber,
  timestampMs: tx.timestampMs,
  tx,
});

const toEventItem = (event: RmEvent, timestampMs: number): LiveItem => ({
  type: "event",
  key: event.id,
  blockNumber: event.blockNumber,
  timestampMs,
  logIndex: event.logIndex,
  event,
});

/** Newest block first. Within a block, decoded Ritual Mind events come before raw txs, then
 *  by log order, so the stream reads cleanly. */
function compareItems(a: LiveItem, b: LiveItem): number {
  if (a.blockNumber !== b.blockNumber) return b.blockNumber - a.blockNumber;
  if (a.type !== b.type) return a.type === "event" ? -1 : 1;
  if (a.type === "event" && b.type === "event") return a.logIndex - b.logIndex;
  return 0;
}

/**
 * Live activity from genuine Ritual Network events. A WebSocket subscribes to new block
 * heads. On each new head the corresponding blocks are fetched for transactions, and the
 * ActivityEmitter logs for the same block range are fetched and decoded, so real Ritual Mind
 * events (score updates, badges, digests, deployments) appear alongside raw transactions.
 * Only items with a key not seen before are prepended, so the feed animates in solely for
 * genuine new events, never simulated ones. If the WebSocket cannot connect, the same loop
 * polls the RPC for the head instead.
 */
export function useLiveActivity(max = 40): {items: LiveItem[]; status: LiveStatus} {
  const [items, setItems] = useState<LiveItem[]>([]);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const seen = useRef<Set<string>>(new Set());
  const lastBlock = useRef<number>(0);
  const head = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let reconnect: ReturnType<typeof setTimeout> | null = null;

    const mergeItems = (incoming: LiveItem[]): void => {
      const fresh = incoming.filter((item) => !seen.current.has(item.key));
      if (fresh.length === 0) return;
      for (const item of fresh) seen.current.add(item.key);
      if (seen.current.size > 4000) seen.current = new Set([...seen.current].slice(-2000));
      setItems((prev) => [...fresh, ...prev].sort(compareItems).slice(0, max));
    };

    const buildItems = (txs: ChainTx[], events: RmEvent[]): LiveItem[] => {
      const tsByBlock = new Map(txs.map((tx) => [tx.blockNumber, tx.timestampMs]));
      const fallbackTs = txs.length > 0 ? Math.max(...txs.map((tx) => tx.timestampMs)) : Date.now();
      return [...txs.map(toTxItem), ...events.map((event) => toEventItem(event, tsByBlock.get(event.blockNumber) ?? fallbackTs))];
    };

    const seed = async (): Promise<void> => {
      const recent = await getRecentActivity(20);
      if (cancelled) return;
      const head0 = recent.length > 0 ? Math.max(...recent.map((tx) => tx.blockNumber)) : await getLatestBlockNumber();
      const events = contractsConfigured() ? await getActivityEmitterEvents(Math.max(0, head0 - 19), head0) : [];
      if (cancelled) return;
      const built = buildItems(recent, events).sort(compareItems);
      for (const item of built) seen.current.add(item.key);
      setItems(built.slice(0, max));
      lastBlock.current = head0;
      head.current = head0;
    };

    const process = async (): Promise<void> => {
      try {
        let target = head.current;
        if (target <= lastBlock.current) {
          target = await getLatestBlockNumber();
        }
        if (target > lastBlock.current) {
          const from = Math.max(lastBlock.current + 1, target - 29);
          const numbers: number[] = [];
          for (let n = from; n <= target; n += 1) numbers.push(n);
          const [txs, events] = await Promise.all([
            getActivityForBlocks(numbers),
            contractsConfigured() ? getActivityEmitterEvents(from, target) : Promise.resolve([] as RmEvent[]),
          ]);
          if (cancelled) return;
          mergeItems(buildItems(txs, events));
          lastBlock.current = target;
        }
      } catch {
        // Transient RPC error. The next interval will retry.
      }
    };

    const connect = (): void => {
      try {
        socket = new WebSocket(WS_URL);
        socket.onopen = () => {
          if (cancelled || socket === null) return;
          setStatus("live");
          socket.send(JSON.stringify({jsonrpc: "2.0", id: 1, method: "eth_subscribe", params: ["newHeads"]}));
        };
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as NewHeadsMessage;
            const numberHex = message.params?.result?.number;
            if (numberHex !== undefined) {
              const n = Number(BigInt(numberHex));
              if (n > head.current) head.current = n;
            }
          } catch {
            // Ignore non JSON frames.
          }
        };
        socket.onerror = () => {
          if (!cancelled) setStatus("polling");
        };
        socket.onclose = () => {
          if (cancelled) return;
          setStatus("polling");
          reconnect = setTimeout(connect, 5000);
        };
      } catch {
        setStatus("polling");
      }
    };

    seed()
      .then(() => {
        if (cancelled) return;
        connect();
        interval = setInterval(() => {
          void process();
        }, 2000);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (socket !== null) {
        socket.onclose = null;
        socket.close();
      }
      if (interval !== null) clearInterval(interval);
      if (reconnect !== null) clearTimeout(reconnect);
    };
  }, [max]);

  return {items, status};
}
