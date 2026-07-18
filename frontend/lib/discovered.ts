"use client";

import {useEffect, useState} from "react";

/**
 * Discovered wallets store.
 *
 * When a wallet is searched, and its /wallet/<address> view opens, its address is remembered
 * here so the leaderboard can surface it going forward. No registration and no manual action is
 * needed. Scores are always read live from the WalletRegistry, so a remembered address only
 * appears in the ranking once it actually has an on-chain score; nothing is fabricated.
 *
 * Persistence is localStorage, so the remembered list is per-browser (this app has no backend).
 * The address list is the only thing stored; every score shown next to it is a fresh contract
 * read, never a cached or invented number.
 */

const KEY = "ritual-mind:discovered-wallets";
const MAX = 100;
const EVENT = "ritual-mind:discovered-changed";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string" && ADDRESS_RE.test(value));
  } catch {
    return [];
  }
}

/** All remembered (searched) addresses, newest first, lowercased. */
export function getDiscovered(): string[] {
  return read();
}

/**
 * Remember a searched address. Deduplicates (moving it to the front), caps the list, and
 * notifies any open view so the leaderboard updates without a reload. No-op for invalid input
 * or on the server.
 */
export function addDiscovered(address: string): void {
  if (typeof window === "undefined" || !ADDRESS_RE.test(address)) return;
  const lower = address.toLowerCase();
  const current = read();
  const next = [lower, ...current.filter((entry) => entry !== lower)].slice(0, MAX);
  // Nothing changed (already at the front), so skip the write and the event.
  if (next.length === current.length && next.every((entry, index) => entry === current[index])) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // localStorage may be unavailable (private mode or quota). The wallet view still works.
  }
}

/**
 * Reactive list of remembered addresses. Updates on changes made in this tab (custom event) and
 * in other tabs (storage event). Starts empty on the server and hydrates on mount, so it never
 * causes a hydration mismatch.
 */
export function useDiscovered(): string[] {
  const [addresses, setAddresses] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setAddresses(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return addresses;
}
