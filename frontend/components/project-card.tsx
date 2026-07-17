import Link from "next/link";
import {ArrowUpRight, ShieldCheck} from "lucide-react";
import {Tag} from "@/components/ui/primitives";
import type {Project} from "@/lib/types";
import {compact, cn} from "@/lib/utils";

/**
 * A registered project, every field read from the ProjectRegistry. The on chain struct has
 * no time series, so there is no sparkline; only the real scalar metrics the contract stores
 * are shown. Growth is basis points from the agent, may be negative.
 */
export function ProjectCard({project}: {project: Project}) {
  const growthUp = project.growthRate >= 0;
  return (
    <Link
      href={`/projects/${project.address}`}
      className="group block rounded-2xl border border-line bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-ink">{project.name}</span>
            {project.isVerified ? <ShieldCheck size={14} className="text-good" /> : null}
          </div>
          <div className="mt-1.5">
            <Tag tone="neutral">{project.category}</Tag>
          </div>
        </div>
        <ArrowUpRight size={16} className="text-ink-dim transition-colors group-hover:text-brand" />
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-muted">{project.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-3 border-t border-line pt-4 sm:grid-cols-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Weekly active</div>
          <div className="mt-0.5 font-mono text-sm text-ink">{compact(project.weeklyActiveWallets)}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Total txns</div>
          <div className="mt-0.5 font-mono text-sm text-ink">{compact(project.totalTxns)}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Health</div>
          <div className="mt-0.5 font-mono text-sm text-ink">{project.healthScore}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Growth</div>
          <div className={cn("mt-0.5 font-mono text-sm", growthUp ? "text-good" : "text-bad")}>
            {growthUp ? "+" : ""}
            {(project.growthRate / 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </Link>
  );
}
