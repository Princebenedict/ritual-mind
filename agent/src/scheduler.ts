/**
 * Cycle timing. The running agent is an off chain service and drives its own six hour
 * cadence with a timer. On chain, only contracts can call the Scheduler system contract
 * (0x56e7...58B), so a production persistent agent deployed through the Persistent Agent
 * factory has its launcher arm the Scheduler. This module holds the timing math the off
 * chain loop uses and the daily digest gate.
 */

const DAY_MS = 86_400_000;

/** Days since the Unix epoch. Used as the on chain dayIndex for the digest. */
export function currentDayIndex(nowMs: number = Date.now()): number {
  return Math.floor(nowMs / DAY_MS);
}

/** The digest is posted once per day, on the first cycle of a new UTC day. */
export function shouldPostDigest(lastDigestDayIndex: number, nowMs: number = Date.now()): boolean {
  return currentDayIndex(nowMs) > lastDigestDayIndex;
}

/** Milliseconds until the next cycle should run, given the interval and the last run. */
export function msUntilNextCycle(intervalMs: number, lastRunMs: number, nowMs: number = Date.now()): number {
  const next = lastRunMs + intervalMs;
  return Math.max(0, next - nowMs);
}
