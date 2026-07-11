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
import {getWalletReputation, isReputationConfigured} from "./reputation";

/**
 * Data hooks. Every hook reads real Ritual Network data. There is no demo or seeded data.
 * Each hook exposes loading and error states so the UI can show a loading indicator or an
 * honest unavailable message instead of a fabricated value.
 */

const WS_URL = process.env.NEXT_PUBLIC_RITUAL_WS_URL ?? "wss://rpc.ritualfoundation.org/ws";

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

/** Real on chain reputation. Enabled only when the WalletRegistry is deployed and its
 *  address is configured. Until then it never fires and the UI shows the pending state. */
export function useWalletReputation(address: string) {
  return useQuery({
    queryKey: ["reputation", address.toLowerCase()],
    queryFn: () => getWalletReputation(address),
    enabled: isReputationConfigured() && isValidAddress(address),
    staleTime: 30000,
  });
}

export {isReputationConfigured};

export type LiveStatus = "connecting" | "live" | "polling" | "error";

interface NewHeadsMessage {
  params?: {result?: {number?: string}};
}

/**
 * Live activity from genuine Ritual Network events. A WebSocket subscribes to new block
 * heads. On each new head the corresponding blocks are fetched and only transactions with
 * a hash not seen before are prepended, so items animate in only for real events. If the
 * WebSocket cannot connect, the same processing loop polls the RPC for the head instead.
 */
export function useLiveActivity(max = 40): {items: ChainTx[]; status: LiveStatus} {
  const [items, setItems] = useState<ChainTx[]>([]);
  const [status, setStatus] = useState<LiveStatus>("connecting");
  const seen = useRef<Set<string>>(new Set());
  const lastBlock = useRef<number>(0);
  const head = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let reconnect: ReturnType<typeof setTimeout> | null = null;

    const mergeNew = (incoming: ChainTx[]): void => {
      const fresh = incoming.filter((tx) => !seen.current.has(tx.hash));
      if (fresh.length === 0) return;
      for (const tx of fresh) seen.current.add(tx.hash);
      if (seen.current.size > 4000) seen.current = new Set([...seen.current].slice(-2000));
      setItems((prev) => [...fresh, ...prev].slice(0, max));
    };

    const seed = async (): Promise<void> => {
      const recent = await getRecentActivity(20);
      if (cancelled) return;
      for (const tx of recent) seen.current.add(tx.hash);
      setItems(recent.slice(0, max));
      lastBlock.current =
        recent.length > 0 ? Math.max(...recent.map((tx) => tx.blockNumber)) : await getLatestBlockNumber();
      head.current = lastBlock.current;
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
          const txs = await getActivityForBlocks(numbers);
          if (cancelled) return;
          mergeNew(txs);
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
