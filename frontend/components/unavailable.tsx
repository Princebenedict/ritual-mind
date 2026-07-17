import type {ReactNode} from "react";
import {Info} from "lucide-react";
import {cn} from "@/lib/utils";

/**
 * Honest empty and unavailable state. Shown wherever data cannot be verified from an
 * official Ritual source. The product prefers this to a fabricated value.
 */
export function Unavailable({title, children, className}: {title: string; children?: ReactNode; className?: string}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-line bg-card px-6 py-12 text-center shadow-soft",
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-ink/[0.03] text-ink-dim">
        <Info size={18} />
      </div>
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {children !== undefined ? <p className="max-w-md text-sm leading-relaxed text-ink-muted">{children}</p> : null}
    </div>
  );
}
