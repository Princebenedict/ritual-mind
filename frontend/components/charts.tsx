"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {ScoreSnapshot, WalletProfile} from "@/lib/types";
import {BAND_HEX, bandFor} from "@/lib/utils";

const GRID = "rgba(0,0,0,0.05)";
const AXIS = "rgba(0,0,0,0.10)";
const TICK = "#8A8A8A";
const CURSOR = "rgba(0,0,0,0.10)";

interface TipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({active, payload, label}: {active?: boolean; payload?: TipEntry[]; label?: string}) {
  if (active !== true || payload === undefined || payload.length === 0) return null;
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2.5 shadow-soft-lg">
      {label !== undefined ? <div className="mb-1.5 font-mono text-[11px] text-ink-dim">{label}</div> : null}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-5 text-xs">
          <span className="flex items-center gap-2 text-ink-muted">
            <span className="inline-block h-2 w-2 rounded-full" style={{background: entry.color ?? "#256E60"}} />
            {entry.name}
          </span>
          <span className="font-mono text-ink">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function dateLabel(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {month: "short", day: "numeric", timeZone: "UTC"});
}

/** Thirty day composite history with a soft accent gradient and smooth curves. */
export function HistoryChart({history}: {history: ScoreSnapshot[]}) {
  const data = history.map((point) => ({
    date: dateLabel(point.timestamp),
    Composite: point.composite,
    Builder: point.builder,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{top: 10, right: 8, left: -12, bottom: 0}}>
          <defs>
            <linearGradient id="composite" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#256E60" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#256E60" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" stroke={AXIS} tick={{fill: TICK, fontSize: 11}} tickLine={false} minTickGap={28} />
          <YAxis stroke={AXIS} tick={{fill: TICK, fontSize: 11}} tickLine={false} width={40} domain={[0, 1000]} />
          <Tooltip content={<ChartTooltip />} cursor={{stroke: CURSOR}} />
          <Area type="monotone" dataKey="Composite" stroke="#256E60" strokeWidth={2.25} fill="url(#composite)" />
          <Area type="monotone" dataKey="Builder" stroke="#2C7E8C" strokeWidth={1.5} fill="none" strokeOpacity={0.7} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Composite distribution across score bands. */
export function DistributionChart({wallets}: {wallets: WalletProfile[]}) {
  const buckets = [
    {label: "0-199", min: 0, max: 200},
    {label: "200-399", min: 200, max: 400},
    {label: "400-599", min: 400, max: 600},
    {label: "600-799", min: 600, max: 800},
    {label: "800+", min: 800, max: 1001},
  ];
  const data = buckets.map((bucket) => ({
    label: bucket.label,
    count: wallets.filter((wallet) => wallet.composite >= bucket.min && wallet.composite < bucket.max).length,
    mid: (bucket.min + bucket.max) / 2,
  }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{top: 10, right: 8, left: -18, bottom: 0}}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" stroke={AXIS} tick={{fill: TICK, fontSize: 11}} tickLine={false} />
          <YAxis stroke={AXIS} tick={{fill: TICK, fontSize: 11}} tickLine={false} width={36} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{fill: "rgba(0,0,0,0.03)"}} />
          <Bar dataKey="count" name="Wallets" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={BAND_HEX[bandFor(entry.mid, 1000)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Stacked social sentiment over time. */
export function SentimentChart({data}: {data: Array<{t: number; bullish: number; neutral: number; cautious: number}>}) {
  const series = data.map((point) => ({
    date: dateLabel(point.t),
    Bullish: point.bullish,
    Neutral: point.neutral,
    Cautious: point.cautious,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{top: 10, right: 8, left: -18, bottom: 0}}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="date" stroke={AXIS} tick={{fill: TICK, fontSize: 11}} tickLine={false} minTickGap={28} />
          <YAxis stroke={AXIS} tick={{fill: TICK, fontSize: 11}} tickLine={false} width={36} />
          <Tooltip content={<ChartTooltip />} cursor={{stroke: CURSOR}} />
          <Area type="monotone" dataKey="Bullish" stackId="1" stroke="#1E7A5A" fill="#1E7A5A" fillOpacity={0.14} />
          <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#9A9A9A" fill="#9A9A9A" fillOpacity={0.1} />
          <Area type="monotone" dataKey="Cautious" stackId="1" stroke="#8A6D22" fill="#8A6D22" fillOpacity={0.12} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Compact sparkline for project weekly active wallets. */
export function MiniSpark({values, color = "#1E7A5A"}: {values: number[]; color?: string}) {
  const data = values.map((value, index) => ({index, value}));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{top: 2, right: 0, left: 0, bottom: 0}}>
          <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} fillOpacity={0.75} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
