"use client";

import {ArrowUpRight, FileText} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {SectionLabel, Skeleton} from "@/components/ui/primitives";
import {useRitualMindEvents} from "@/lib/hooks";
import {CONTRACTS, explorerAddress, explorerTx} from "@/lib/chain";
import {shortHash} from "@/lib/rpc";

export default function IntelPage() {
  const {data: events, isLoading, isError} = useRitualMindEvents();
  const digests = (events ?? []).filter((event) => event.kind === "DigestPosted");

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Intelligence"
        title="Intel"
        description="Daily ecosystem briefs written by the agent inside the enclave and posted on chain with a TEE attestation hash. Read from the ActivityEmitter, never fabricated."
        actions={
          <a
            href={explorerAddress(CONTRACTS.activityEmitter)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand"
          >
            ActivityEmitter <ArrowUpRight size={13} />
          </a>
        }
      />

      <div className="mt-6">
        {isError ? (
          <Unavailable title="Intel could not be read">
            The ActivityEmitter did not respond. Digests are only ever shown from a real event read, so nothing is
            displayed until the read succeeds.
          </Unavailable>
        ) : isLoading || events === undefined ? (
          <Skeleton className="h-40 w-full" />
        ) : digests.length === 0 ? (
          <Unavailable title="No digests posted yet">
            The ActivityEmitter is live on chain, and this fills in automatically once the agent posts its first daily
            digest. Each digest is written to IPFS and referenced on chain with a TEE attestation hash. Nothing here is
            fabricated.
          </Unavailable>
        ) : (
          <div className="space-y-3">
            {digests.map((digest) => (
              <div key={digest.id} className="flex items-start gap-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.06] text-brand">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-ink">Daily digest, {digest.detail}</div>
                  <div className="mt-1">
                    <SectionLabel>Posted on chain by the agent</SectionLabel>
                  </div>
                  <a
                    href={explorerTx(digest.txHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-good hover:underline"
                  >
                    tx {shortHash(digest.txHash)} · block {digest.blockNumber.toLocaleString("en-US")}
                    <ArrowUpRight size={11} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
