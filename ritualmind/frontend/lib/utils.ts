import {clsx, type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Truncate an address to 0x1234...5678. Addresses always render this way. */
export function shortAddress(address: string, lead = 6, tail = 4): string {
  if (address.length <= lead + tail) return address;
  return `${address.slice(0, lead)}...${address.slice(-tail)}`;
}

const compactFormatter = new Intl.NumberFormat("en-US", {notation: "compact", maximumFractionDigits: 1});
const plainFormatter = new Intl.NumberFormat("en-US");

export function compact(value: number): string {
  return compactFormatter.format(value);
}

export function withCommas(value: number): string {
  return plainFormatter.format(value);
}

export function signed(value: number): string {
  if (value > 0) return `+${withCommas(value)}`;
  return withCommas(value);
}

export type Band = "good" | "brand" | "bad";

/** Score band by threshold. Emerald above 700, teal 400 to 699, soft coral below 400. */
export function bandFor(value: number, max = 1000): Band {
  const ratio = (value / max) * 1000;
  if (ratio >= 700) return "good";
  if (ratio >= 400) return "brand";
  return "bad";
}

export const BAND_HEX: Record<Band, string> = {
  good: "#1E7A5A",
  brand: "#256E60",
  bad: "#B23B2E",
};

export const BAND_TEXT: Record<Band, string> = {
  good: "text-good",
  brand: "text-brand",
  bad: "text-bad",
};

/** Human readable relative time from a unix seconds timestamp. */
export function timeAgo(unixSeconds: number, nowMs = Date.now()): string {
  const deltaSec = Math.max(0, Math.floor(nowMs / 1000) - unixSeconds);
  if (deltaSec < 60) return `${deltaSec}s ago`;
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDateUtc(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
