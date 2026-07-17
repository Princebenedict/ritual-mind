"use client";

import type {ReactNode} from "react";
import {ArrowDownRight, ArrowUpRight} from "lucide-react";
import {Counter} from "@/components/ui/motion";
import {cn} from "@/lib/utils";

export function StatCard({
  label,
  value,
  suffix,
  delta,
  icon,
  decimals,
}: {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  icon?: ReactNode;
  decimals?: number;
}) {
  // Build the formatter inside this client component so callers pass only serializable
  // props. Server components cannot pass a function across the boundary.
  const format = decimals !== undefined ? (n: number): string => n.toFixed(decimals) : undefined;
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">{label}</span>
        {icon !== undefined ? <span className="text-ink-dim">{icon}</span> : null}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <Counter value={value} format={format} className="text-2xl font-bold text-ink" />
        {suffix !== undefined ? <span className="font-mono text-sm text-ink-dim">{suffix}</span> : null}
      </div>
      {delta !== undefined ? (
        <div className={cn("mt-2 flex items-center gap-1 text-xs", delta >= 0 ? "text-good" : "text-bad")}>
          {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          <span className="font-mono">{Math.abs(delta)}%</span>
          <span className="text-ink-dim">over 7 days</span>
        </div>
      ) : null}
    </div>
  );
}
