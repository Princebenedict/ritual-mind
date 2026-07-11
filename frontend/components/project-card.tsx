import Link from "next/link";
import {ArrowUpRight, ShieldCheck} from "lucide-react";
import {MiniSpark} from "@/components/charts";
import {Tag} from "@/components/ui/primitives";
import type {Project} from "@/lib/types";
import {compact, cn} from "@/lib/utils";

export function ProjectCard({project}: {project: Project}) {
  const growthUp = project.growthRate >= 0;
  return (
    <Link
      href={`/projects/${project.address}`}
      className="group block rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg"
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

      <div className="mt-4">
        <MiniSpark values={project.wauHistory} color={growthUp ? "#1E7A5A" : "#B23B2E"} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Weekly active</div>
          <div className="mt-0.5 font-mono text-sm text-ink">{compact(project.weeklyActiveWallets)}</div>
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
