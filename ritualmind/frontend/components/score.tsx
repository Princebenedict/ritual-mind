"use client";

import {motion, useReducedMotion} from "framer-motion";
import {Counter} from "@/components/ui/motion";
import {BAND_HEX, bandFor} from "@/lib/utils";

const RING_EASE = [0.16, 1, 0.3, 1] as const;

/** The composite score ring. Animated arc fill, band colored, rounded cap. */
export function ScoreRing({
  value,
  max = 1000,
  size = 224,
  stroke = 12,
  label = "Composite",
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));
  const band = bandFor(value, max);
  const color = BAND_HEX[band];
  const offset = circumference * (1 - ratio);

  return (
    <div className="relative" style={{width: size, height: size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{strokeDashoffset: reduce ? offset : circumference}}
          animate={{strokeDashoffset: offset}}
          transition={{duration: 1.2, ease: RING_EASE}}
          style={{filter: `drop-shadow(0 0 8px ${color}55)`}}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Counter value={value} className="text-5xl font-bold leading-none" />
        <span className="mt-1 font-mono text-xs text-ink-dim">out of {max}</span>
        <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{label}</span>
      </div>
    </div>
  );
}

function MiniRing({value, max, label, size = 92, stroke = 7}: {value: number; max: number; label: string; size?: number; stroke?: number}) {
  const reduce = useReducedMotion();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));
  const color = BAND_HEX[bandFor(value, max)];
  const offset = circumference * (1 - ratio);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{width: size, height: size}}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} fill="none" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{strokeDashoffset: reduce ? offset : circumference}}
            animate={{strokeDashoffset: offset}}
            transition={{duration: 1.1, ease: RING_EASE}}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold tabular">{value}</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-muted">{label}</div>
        <div className="font-mono text-[10px] text-ink-dim">/ {max}</div>
      </div>
    </div>
  );
}

export function SubScoreRings({builder, advocate, community, user}: {builder: number; advocate: number; community: number; user: number}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <MiniRing value={builder} max={400} label="Builder" />
      <MiniRing value={advocate} max={300} label="Advocate" />
      <MiniRing value={community} max={200} label="Community" />
      <MiniRing value={user} max={100} label="User" />
    </div>
  );
}
