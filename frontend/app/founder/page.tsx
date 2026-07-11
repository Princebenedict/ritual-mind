"use client";

import type {ReactNode} from "react";
import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {Card, SectionLabel, Skeleton} from "@/components/ui/primitives";
import {useLeaderboard, useTotalProjects, useTotalRegistered} from "@/lib/hooks";
import {withCommas} from "@/lib/utils";

function Tile({label, value, sub}: {label: string; value: ReactNode; sub?: string}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">{label}</div>
      <div className="mt-2 font-mono text-2xl font-bold tabular text-ink">{value}</div>
      {sub !== undefined ? <div className="mt-1 text-xs text-ink-dim">{sub}</div> : null}
    </div>
  );
}

export default function FounderPage() {
  const {data: totalWallets, isLoading, isError} = useTotalRegistered();
  const {data: totalProjects} = useTotalProjects();
  const {data: wallets} = useLeaderboard(50);

  const scored = (wallets ?? []).filter((wallet) => wallet.composite > 0);
  const verified = (wallets ?? []).filter((wallet) => wallet.isVerifiedBuilder);
  const nothingYet = (totalWallets ?? 0) === 0 && (totalProjects ?? 0) === 0;

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Operate"
        title="Founder studio"
        description="Growth and contributor intelligence derived from on chain reputation. Every figure is read from the deployed Ritual Mind contracts, never estimated."
      />

      <div className="mt-6">
        {isError ? (
          <Unavailable title="Founder analytics could not be read">
            The Ritual Mind contracts did not respond. These figures are only ever shown from a real contract read, so
            nothing is displayed until the read succeeds.
          </Unavailable>
        ) : isLoading || totalWallets === undefined ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({length: 4}).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile label="Registered wallets" value={withCommas(totalWallets ?? 0)} />
              <Tile label="Registered projects" value={withCommas(totalProjects ?? 0)} />
              <Tile label="Scored wallets" value={withCommas(scored.length)} sub="composite above zero" />
              <Tile label="Verified builders" value={withCommas(verified.length)} />
            </div>

            {nothingYet ? (
              <Card>
                <SectionLabel>Nothing to analyze yet</SectionLabel>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  The reputation layer is live on chain, but no wallet has registered and no project has been added yet,
                  so the counts above are a true zero read from the contracts. Contributor cohorts, growth curves, and
                  builder funnels populate here automatically as wallets register and the agent scores them. Nothing on
                  this page is estimated.
                </p>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </Container>
  );
}
