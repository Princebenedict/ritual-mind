"use client";

import type {ReactNode} from "react";
import {Container, PageHeader} from "@/components/page";
import {NetworkStatus} from "@/components/network-status";
import {Unavailable} from "@/components/unavailable";
import {Card, SectionLabel, Skeleton} from "@/components/ui/primitives";
import {DistributionChart} from "@/components/charts";
import {useLeaderboard, useTotalProjects, useTotalRegistered} from "@/lib/hooks";
import {withCommas} from "@/lib/utils";

function StatTile({label, value, sub}: {label: string; value: ReactNode; sub?: string}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">{label}</div>
      <div className="mt-2 font-mono text-2xl font-bold tabular text-ink">{value}</div>
      {sub !== undefined ? <div className="mt-1 text-xs text-ink-dim">{sub}</div> : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const {data: totalWallets, isError: walletsError} = useTotalRegistered();
  const {data: totalProjects} = useTotalProjects();
  const {data: wallets, isLoading, isError} = useLeaderboard(50);

  const scored = wallets?.filter((wallet) => wallet.composite > 0) ?? [];
  const averageComposite =
    scored.length > 0 ? Math.round(scored.reduce((sum, wallet) => sum + wallet.composite, 0) / scored.length) : 0;

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Intelligence"
        title="Analytics"
        description="Live Ritual Network measures from the RPC, and reputation measures read from the deployed Ritual Mind contracts. Every figure is real; nothing is estimated."
      />

      <div className="mt-6">
        <SectionLabel>Ritual Network, live from the RPC</SectionLabel>
        <div className="mt-3">
          <NetworkStatus />
        </div>
      </div>

      <div className="mt-8">
        <SectionLabel>Reputation, from the Ritual Mind contracts</SectionLabel>
        <div className="mt-3">
          {isError || walletsError ? (
            <Unavailable title="Reputation measures could not be read">
              The Ritual Mind contracts did not respond. These figures are only ever shown from a real contract read, so
              nothing is displayed until the read succeeds.
            </Unavailable>
          ) : isLoading || wallets === undefined ? (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({length: 4}).map((_, index) => (
                <Skeleton key={index} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Registered wallets" value={withCommas(totalWallets ?? 0)} />
                <StatTile label="Scored wallets" value={withCommas(scored.length)} sub="composite above zero" />
                <StatTile
                  label="Average composite"
                  value={scored.length > 0 ? withCommas(averageComposite) : "—"}
                  sub={scored.length > 0 ? "of top scored wallets" : "no scored wallets yet"}
                />
                <StatTile label="Registered projects" value={withCommas(totalProjects ?? 0)} />
              </div>

              <Card>
                <SectionLabel>Composite score distribution</SectionLabel>
                {scored.length > 0 ? (
                  <div className="mt-4">
                    <DistributionChart wallets={scored} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-ink-muted">
                    No wallet has a score yet, so there is no distribution to plot. This chart draws itself from the real
                    top wallets once the agent has scored them. The counts above are read live from the contracts.
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
