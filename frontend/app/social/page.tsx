"use client";

import {useMemo} from "react";
import {Megaphone} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {Card, SectionLabel, Skeleton} from "@/components/ui/primitives";
import {LeaderboardTable} from "@/components/leaderboard-table";
import {useLeaderboard, useRitualMindEvents} from "@/lib/hooks";
import {explorerTx} from "@/lib/chain";
import {shortAddress} from "@/lib/utils";
import {shortHash} from "@/lib/rpc";

export default function SocialPage() {
  const {data: wallets, isLoading, isError} = useLeaderboard(50);
  const {data: events} = useRitualMindEvents();

  const advocates = useMemo(
    () => (wallets ?? []).filter((wallet) => wallet.advocate > 0).sort((a, b) => b.advocate - a.advocate),
    [wallets],
  );
  const milestones = (events ?? []).filter((event) => event.kind === "SocialMilestone");
  const empty = advocates.length === 0 && milestones.length === 0;

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Intelligence"
        title="Social pulse"
        description="Advocate reputation scored for content quality inside the enclave and written on chain. Rankings come from the WalletRegistry advocate score; nothing is invented."
      />

      <div className="mt-6">
        {isError ? (
          <Unavailable title="Social intelligence could not be read">
            The Ritual Mind contracts did not respond. Advocate rankings are only ever shown from a real contract read,
            so nothing is displayed until the read succeeds.
          </Unavailable>
        ) : isLoading || wallets === undefined ? (
          <Skeleton className="h-72 w-full" />
        ) : empty ? (
          <Unavailable title="No advocate scores yet">
            No wallet has an advocate score above zero and no social milestone has been emitted. This view fills in
            automatically once the agent scores content quality and writes the results on chain. No sentiment, advocate,
            or content figures are invented.
          </Unavailable>
        ) : (
          <div className="space-y-8">
            {advocates.length > 0 ? (
              <div>
                <div className="mb-3">
                  <SectionLabel>Top advocates by on chain advocate score</SectionLabel>
                </div>
                <LeaderboardTable wallets={advocates} metric="advocate" />
              </div>
            ) : null}

            {milestones.length > 0 ? (
              <div>
                <div className="mb-3">
                  <SectionLabel>Recent social milestones</SectionLabel>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {milestones.map((milestone) => (
                    <Card key={milestone.id}>
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-data/20 bg-data/[0.08] text-data">
                          <Megaphone size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-ink">{milestone.detail}</div>
                          <div className="mt-1 font-mono text-[11px] text-ink-dim">
                            {milestone.wallet !== null ? `${shortAddress(milestone.wallet)} · ` : ""}
                            <a href={explorerTx(milestone.txHash)} target="_blank" rel="noreferrer" className="hover:text-brand">
                              {shortHash(milestone.txHash)}
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Container>
  );
}
