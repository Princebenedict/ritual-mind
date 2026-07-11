"use client";

import Link from "next/link";
import {AnimatePresence, motion} from "framer-motion";
import {
  ArrowLeftRight,
  Award,
  Boxes,
  CheckCircle2,
  Clock,
  Cpu,
  FileCode2,
  FileText,
  Handshake,
  Megaphone,
  PackagePlus,
  Radio,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {formatEther} from "viem";
import {useLiveActivity, type LiveItem} from "@/lib/hooks";
import {explorerBlock, explorerTx} from "@/lib/chain";
import {shortHash, type ChainTx, type TxKind} from "@/lib/rpc";
import {shortAddress, timeAgo, cn} from "@/lib/utils";
import {Skeleton} from "@/components/ui/primitives";
import {Unavailable} from "@/components/unavailable";

const KIND: Record<TxKind, {icon: LucideIcon; accent: string}> = {
  scheduled: {icon: Clock, accent: "text-gold"},
  commitment: {icon: Radio, accent: "text-data"},
  settlement: {icon: CheckCircle2, accent: "text-good"},
  creation: {icon: FileCode2, accent: "text-info"},
  transfer: {icon: ArrowLeftRight, accent: "text-brand"},
  call: {icon: Boxes, accent: "text-agent"},
};

/** Icon and accent for each decoded ActivityEmitter event. */
const EVENT_META: Record<string, {icon: LucideIcon; accent: string}> = {
  ScoreUpdated: {icon: TrendingUp, accent: "text-brand"},
  ContractDeployed: {icon: FileCode2, accent: "text-info"},
  ProjectRegistered: {icon: PackagePlus, accent: "text-agent"},
  AttestationGiven: {icon: Handshake, accent: "text-good"},
  BadgeEarned: {icon: Award, accent: "text-gold"},
  AgentExecution: {icon: Cpu, accent: "text-agent"},
  SocialMilestone: {icon: Megaphone, accent: "text-data"},
  DigestPosted: {icon: FileText, accent: "text-brand"},
  WalletFlagged: {icon: ShieldAlert, accent: "text-bad"},
};

function TxRow({tx}: {tx: ChainTx}) {
  const {icon: Icon, accent} = KIND[tx.kind];
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-black/[0.03]",
          accent,
        )}
      >
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-ink">
            {tx.label}
            {tx.precompile !== null ? <span className="text-ink-dim"> · {tx.precompile}</span> : null}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-ink-dim">{timeAgo(Math.floor(tx.timestampMs / 1000))}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer" className="font-mono text-ink-dim hover:text-brand">
            {shortHash(tx.hash)}
          </a>
          {tx.to !== null ? (
            <span className="font-mono text-ink-dim">
              to{" "}
              <Link href={`/wallet/${tx.to}`} className="hover:text-brand">
                {shortAddress(tx.to)}
              </Link>
            </span>
          ) : null}
          {tx.valueWei > 0n ? <span className="font-mono text-good">{formatEther(tx.valueWei)} RITUAL</span> : null}
          <a
            href={explorerBlock(tx.blockNumber)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-ink-dim hover:text-brand"
          >
            block {tx.blockNumber.toLocaleString("en-US")}
          </a>
        </div>
      </div>
    </div>
  );
}

function EventRow({item}: {item: Extract<LiveItem, {type: "event"}>}) {
  const {event, timestampMs} = item;
  const meta = EVENT_META[event.kind] ?? {icon: Sparkles, accent: "text-brand"};
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 bg-brand/[0.03] px-4 py-3">
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/[0.06]",
          meta.accent,
        )}
      >
        <Icon size={15} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm text-ink">
            {event.label}
            <span className="text-ink-dim"> · {event.detail}</span>
          </span>
          <span className="shrink-0 font-mono text-[11px] text-ink-dim">{timeAgo(Math.floor(timestampMs / 1000))}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="text-[10px] font-bold uppercase tracking-wide text-brand">Ritual Mind</span>
          <a href={explorerTx(event.txHash)} target="_blank" rel="noreferrer" className="font-mono text-ink-dim hover:text-brand">
            {shortHash(event.txHash)}
          </a>
          {event.wallet !== null ? (
            <Link href={`/wallet/${event.wallet}`} className="font-mono text-ink-dim hover:text-brand">
              {shortAddress(event.wallet)}
            </Link>
          ) : null}
          <a
            href={explorerBlock(event.blockNumber)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-ink-dim hover:text-brand"
          >
            block {event.blockNumber.toLocaleString("en-US")}
          </a>
        </div>
      </div>
    </div>
  );
}

export function LiveFeed({limit = 14}: {limit?: number}) {
  const {items, status} = useLiveActivity();
  const shown = items.slice(0, limit);

  const statusLabel =
    status === "live"
      ? "live via WebSocket"
      : status === "polling"
        ? "polling RPC"
        : status === "error"
          ? "unavailable"
          : "connecting";

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-soft">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
        <span className="text-sm font-bold text-ink">Live network activity</span>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-dim">
          <span className="relative flex h-1.5 w-1.5">
            {status !== "error" ? (
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-good/50" />
            ) : null}
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", status === "error" ? "bg-bad" : "bg-good")} />
          </span>
          {statusLabel}
        </span>
      </div>

      {status === "error" && shown.length === 0 ? (
        <div className="p-4">
          <Unavailable title="Live activity is unavailable">
            The Ritual RPC could not be reached. This feed shows only real transactions and events and resumes when the
            network responds.
          </Unavailable>
        </div>
      ) : shown.length === 0 && status === "connecting" ? (
        <div className="space-y-3 p-4">
          {Array.from({length: 6}).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="p-4">
          <Unavailable title="No recent transactions">
            The most recent blocks on Ritual contained no transactions. New activity will appear here as it is produced.
          </Unavailable>
        </div>
      ) : (
        <div className="divide-y divide-black/[0.05]">
          <AnimatePresence initial={false}>
            {shown.map((item) => (
              <motion.div
                key={item.key}
                layout
                initial={{opacity: 0, y: -12}}
                animate={{opacity: 1, y: 0}}
                transition={{type: "spring", stiffness: 320, damping: 30}}
              >
                {item.type === "event" ? <EventRow item={item} /> : <TxRow tx={item.tx} />}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
