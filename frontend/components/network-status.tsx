"use client";

import {Blocks, Fuel, Timer, Waypoints} from "lucide-react";
import type {ReactNode} from "react";
import {useNetworkStatus} from "@/lib/hooks";
import {withCommas} from "@/lib/utils";

/**
 * Real network status from the Ritual RPC. Latest block, average block time, gas price,
 * and chain id. Every value updates on a five second interval and reflects genuine chain
 * state. On failure the tiles show Unavailable rather than a placeholder.
 */
function Tile({label, value, icon}: {label: string; value: ReactNode; icon: ReactNode}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">{label}</span>
        <span className="text-ink-dim">{icon}</span>
      </div>
      <div className="mt-3 font-mono text-2xl font-bold tabular text-ink">{value}</div>
    </div>
  );
}

export function NetworkStatus() {
  const {data, isLoading, isError} = useNetworkStatus();

  const value = (render: (status: NonNullable<typeof data>) => ReactNode): ReactNode => {
    if (isError) return <span className="text-base font-normal text-ink-dim">Unavailable</span>;
    if (isLoading || data === undefined) return <span className="text-base font-normal text-ink-dim">Loading</span>;
    return render(data);
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Tile label="Latest block" icon={<Blocks size={15} />} value={value((s) => withCommas(s.blockNumber))} />
      <Tile
        label="Block time"
        icon={<Timer size={15} />}
        value={value((s) => (s.blockTimeMs > 0 ? `${(s.blockTimeMs / 1000).toFixed(2)}s` : "Unavailable"))}
      />
      <Tile
        label="Gas price"
        icon={<Fuel size={15} />}
        value={value((s) => `${(Number(s.gasPriceWei) / 1e9).toFixed(2)} gwei`)}
      />
      <Tile label="Chain id" icon={<Waypoints size={15} />} value={value((s) => s.chainId)} />
    </div>
  );
}
