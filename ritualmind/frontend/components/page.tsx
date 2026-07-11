import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

export function Container({children, className, wide = false}: {children: ReactNode; className?: string; wide?: boolean}) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6", wide ? "max-w-wide" : "max-w-content", className)}>{children}</div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line py-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow !== undefined ? (
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-brand">{eyebrow}</div>
        ) : null}
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h1>
        {description !== undefined ? <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p> : null}
      </div>
      {actions !== undefined ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
