import Link from "next/link";
import {ShieldAlert, ShieldCheck} from "lucide-react";
import type {WalletProfile} from "@/lib/types";
import {BAND_TEXT, bandFor, shortAddress, cn} from "@/lib/utils";

export type LeaderMetric = "composite" | "builder" | "advocate" | "community" | "user";

const METRIC_MAX: Record<LeaderMetric, number> = {
  composite: 1000,
  builder: 400,
  advocate: 300,
  community: 200,
  user: 100,
};

function rankStyle(rank: number): string {
  if (rank === 1) return "text-gold";
  if (rank === 2) return "text-ink";
  if (rank === 3) return "text-brand";
  return "text-ink-dim";
}

/** The caller provides wallets already in display order. The metric selects the
 *  highlighted column and its ceiling. */
export function LeaderboardTable({wallets, metric = "composite"}: {wallets: WalletProfile[]; metric?: LeaderMetric}) {
  const ranked = wallets;
  const max = METRIC_MAX[metric];

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">
            <th className="px-4 py-3 font-bold">Rank</th>
            <th className="px-4 py-3 font-bold">Wallet</th>
            <th className="px-4 py-3 text-right font-bold">{metric}</th>
            <th className="hidden px-4 py-3 text-right font-bold sm:table-cell">Badges</th>
            <th className="hidden px-4 py-3 text-right font-bold md:table-cell">Streak</th>
            <th className="px-4 py-3 text-right font-bold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {ranked.map((wallet, index) => {
            const rank = index + 1;
            const value = wallet[metric];
            return (
              <tr key={wallet.address} className="group transition-colors hover:bg-surface">
                <td className={cn("px-4 py-3 font-mono font-bold", rankStyle(rank))}>{rank}</td>
                <td className="px-4 py-3">
                  <Link href={`/wallet/${wallet.address}`} className="flex items-center gap-2">
                    <span className="text-ink group-hover:text-brand">
                      {wallet.twitterHandle ?? shortAddress(wallet.address)}
                    </span>
                    {wallet.twitterHandle !== null ? (
                      <span className="font-mono text-[11px] text-ink-dim">{shortAddress(wallet.address)}</span>
                    ) : null}
                  </Link>
                </td>
                <td className={cn("px-4 py-3 text-right font-mono font-bold tabular", BAND_TEXT[bandFor(value, max)])}>
                  {value}
                </td>
                <td className="hidden px-4 py-3 text-right font-mono text-ink-muted sm:table-cell">{wallet.badges.length}</td>
                <td className="hidden px-4 py-3 text-right font-mono text-ink-muted md:table-cell">{wallet.weeklyStreak}w</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center justify-end gap-2">
                    {wallet.flagSeverity >= 2 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-bad">
                        <ShieldAlert size={13} /> flagged
                      </span>
                    ) : wallet.isVerifiedBuilder ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-good">
                        <ShieldCheck size={13} /> verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-dim">active</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
