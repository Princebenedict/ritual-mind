"use client";

import type {ScoreSnapshot, WalletProfile} from "@/lib/types";
import {BAND_HEX, bandFor} from "@/lib/utils";

/**
 * Dependency-free charts, drawn with inline SVG and CSS. Every chart renders only the real
 * data passed to it; there is no internal sample or placeholder data. Kept lightweight on
 * purpose so the app has no heavy charting dependency.
 */

function dateLabel(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {month: "short", day: "numeric", timeZone: "UTC"});
}

/** Build an SVG path from y-values already normalized to 0..1 (0 bottom, 1 top). */
function linePath(values: number[], width: number, height: number, pad = 4): string {
  if (values.length === 0) return "";
  const w = width - pad * 2;
  const h = height - pad * 2;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${(pad + i * stepX).toFixed(2)} ${(pad + (1 - v) * h).toFixed(2)}`)
    .join(" ");
}

/** Composite score history over time, as a soft filled line. Empty until a wallet has been
 *  scored more than once. */
export function HistoryChart({history}: {history: ScoreSnapshot[]}) {
  if (history.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-ink-muted">No score history yet.</div>;
  }
  const W = 600;
  const H = 240;
  const composites = history.map((point) => point.composite / 1000);
  const path = linePath(composites, W, H);
  const area = `${path} L ${W - 4} ${H - 4} L 4 ${H - 4} Z`;
  const first = history[0];
  const last = history[history.length - 1];
  return (
    <div className="h-64 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="composite-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#256E60" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#256E60" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#composite-fill)" />
        <path d={path} fill="none" stroke="#256E60" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-dim">
        <span>{first !== undefined ? dateLabel(first.timestamp) : ""}</span>
        <span>{last !== undefined ? dateLabel(last.timestamp) : ""}</span>
      </div>
    </div>
  );
}

/** Composite distribution across five score bands, as colored bars. Counts are computed from
 *  the real wallets passed in. */
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
    color: BAND_HEX[bandFor((bucket.min + bucket.max) / 2, 1000)],
  }));
  const maxCount = Math.max(1, ...data.map((bucket) => bucket.count));

  return (
    <div className="flex h-56 w-full items-end gap-3 pt-6">
      {data.map((bucket) => (
        <div key={bucket.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="font-mono text-xs font-bold text-ink">{bucket.count}</span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${Math.max(2, (bucket.count / maxCount) * 100)}%`,
              backgroundColor: bucket.color,
              opacity: bucket.count === 0 ? 0.15 : 1,
            }}
            title={`${bucket.count} wallets in ${bucket.label}`}
          />
          <span className="font-mono text-[11px] text-ink-dim">{bucket.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Stacked social sentiment over time. Renders only the real series passed in. */
export function SentimentChart({data}: {data: Array<{t: number; bullish: number; neutral: number; cautious: number}>}) {
  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-ink-muted">No sentiment data yet.</div>;
  }
  const W = 600;
  const H = 240;
  const totals = data.map((point) => Math.max(1, point.bullish + point.neutral + point.cautious));
  const bullish = data.map((point, i) => point.bullish / totals[i]!);
  const cautious = data.map((point, i) => point.cautious / totals[i]!);
  return (
    <div className="h-64 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
        <path d={linePath(bullish, W, H)} fill="none" stroke="#1E7A5A" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <path d={linePath(cautious, W, H)} fill="none" stroke="#8A6D22" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-dim">
        <span>{dateLabel(data[0]!.t)}</span>
        <span>{dateLabel(data[data.length - 1]!.t)}</span>
      </div>
    </div>
  );
}

/** Compact sparkline for a series of values. */
export function MiniSpark({values, color = "#1E7A5A"}: {values: number[]; color?: string}) {
  if (values.length === 0) return <div className="h-10 w-full" />;
  const W = 200;
  const H = 40;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const normalized = values.map((value) => (value - min) / span);
  return (
    <div className="h-10 w-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full">
        <path d={linePath(normalized, W, H, 2)} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
