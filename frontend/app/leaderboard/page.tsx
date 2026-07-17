"use client";

import {useMemo, useState} from "react";
import {ArrowUpRight} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {Skeleton, Tag} from "@/components/ui/primitives";
import {LeaderboardTable, type LeaderMetric} from "@/components/leaderboard-table";
import {useDiscoveredProfiles, useLeaderboard, useTotalRegistered} from "@/lib/hooks";
import {CONTRACTS, explorerAddress} from "@/lib/chain";
import {cn} from "@/lib/utils";
import type {WalletProfile} from "@/lib/types";

const METRICS: {key: LeaderMetric; label: string}[] = [
  {key: "composite", label: "Composite"},
  {key: "builder", label: "Builder"},
  {key: "advocate", label: "Advocate"},
  {key: "community", label: "Community"},
  {key: "user", label: "User"},
];

export default function LeaderboardPage() {
  const [metric, setMetric] = useState<LeaderMetric>("composite");
  const {data: total} = useTotalRegistered();
  const {data: wallets, isLoading, isError} = useLeaderboard(50);
  const {data: discovered} = useDiscoveredProfiles();

  // Merge the contract's ranked top wallets with any wallets this browser has searched that now
  // have a real score, de-duplicated by address, then rank by the selected metric. Searched
  // wallets persist across visits, so once scored they stay in the ranking going forward.
  const ranked = useMemo(() => {
    if (wallets === undefined) return [];
    const byAddress = new Map<string, WalletProfile>();
    for (const wallet of wallets) byAddress.set(wallet.address.toLowerCase(), wallet);
    for (const wallet of discovered ?? []) {
      const key = wallet.address.toLowerCase();
      if (!byAddress.has(key)) byAddress.set(key, wallet);
    }
    return [...byAddress.values()].sort((a, b) => b[metric] - a[metric]);
  }, [wallets, discovered, metric]);

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Ranking"
        title="Leaderboard"
        description="Wallets ranked by the reputation the agent computes from on-chain activity, read directly from the WalletRegistry. There is no registration and no manual step. Search a wallet on the Explorer and it is added to the ranking automatically once it has an on-chain score. Nothing is estimated."
        actions={
          <a
            href={explorerAddress(CONTRACTS.walletRegistry)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand"
          >
            WalletRegistry <ArrowUpRight size={13} />
          </a>
        }
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                metric === m.key ? "bg-brand/[0.12] text-brand" : "text-ink-dim hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        {typeof total === "number" ? <Tag tone="neutral">{total.toLocaleString("en-US")} scored</Tag> : null}
      </div>

      <div className="mt-4">
        {isError ? (
          <Unavailable title="Leaderboard could not be read">
            The WalletRegistry did not respond. The ranking is only ever shown from a real contract read, so nothing is
            displayed until the read succeeds.
          </Unavailable>
        ) : isLoading || wallets === undefined ? (
          <Skeleton className="h-72 w-full" />
        ) : ranked.length === 0 ? (
          <Unavailable title="No wallets scored yet">
            The agent has not scored any wallets yet, so there is no ranking to show. This table fills in automatically
            after the agent&apos;s next scan of the network. Nobody registers. Wallets are discovered from their on-chain
            activity, and any wallet you search on the Explorer is added here once it has an on-chain score. The count
            above is read live from the contract.
          </Unavailable>
        ) : (
          <LeaderboardTable wallets={ranked} metric={metric} />
        )}
      </div>
    </Container>
  );
}
