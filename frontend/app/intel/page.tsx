"use client";

import {ArrowUpRight, FileText} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {SectionLabel, Tag} from "@/components/ui/primitives";
import {INTEL_FEED, type IntelTag} from "@/lib/intel-feed";
import {useRitualMindEvents} from "@/lib/hooks";
import {explorerTx} from "@/lib/chain";
import {shortHash} from "@/lib/rpc";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** UTC formatting keeps server and client output identical (no hydration mismatch). */
function formatMonth(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const TAG_TONE: Record<IntelTag, "brand" | "info" | "agent" | "data" | "gold"> = {
  Announcement: "brand",
  Product: "info",
  Ecosystem: "agent",
  Research: "data",
  Funding: "gold",
};

export default function IntelPage() {
  const {data: events} = useRitualMindEvents();
  const digests = (events ?? []).filter((event) => event.kind === "DigestPosted");

  const items = [...INTEL_FEED].sort((a, b) => b.iso.localeCompare(a.iso));

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Intelligence"
        title="Intel"
        description="A curated briefing of real Ritual ecosystem news, plus on-chain digests written by the agent when it posts them."
      />

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-2 rounded-2xl border border-line bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg sm:flex-row sm:items-start sm:gap-5"
          >
            <div className="flex w-28 shrink-0 flex-col gap-2">
              <Tag tone={TAG_TONE[item.tag]}>{item.tag}</Tag>
              <span className="font-mono text-xs text-ink-dim">{formatMonth(item.iso)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-ink group-hover:text-brand">
                {item.title}
                <ArrowUpRight size={13} className="ml-1 inline align-[-1px] text-ink-dim group-hover:text-brand" />
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.summary}</p>
              <span className="mt-2 inline-block text-xs text-ink-dim">{item.source}</span>
            </div>
          </a>
        ))}
      </div>

      {digests.length > 0 ? (
        <div className="mt-10">
          <SectionLabel>On-chain digests</SectionLabel>
          <div className="mt-3 space-y-3">
            {digests.map((digest) => (
              <div key={digest.id} className="flex items-start gap-4 rounded-2xl border border-line bg-card p-5 shadow-soft">
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
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-line bg-ink/[0.02] px-5 py-4">
        <SectionLabel>Post your own</SectionLabel>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          The briefing is a plain data file, so you publish updates yourself — no backend, no wallet. Add an entry at the
          top of <span className="font-mono text-ink">lib/intel-feed.ts</span> with a link to the real post, and it goes
          live on the next deploy. On-chain digests from the agent appear above automatically.
        </p>
      </div>
    </Container>
  );
}
