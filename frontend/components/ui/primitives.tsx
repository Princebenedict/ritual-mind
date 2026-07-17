import type {ReactNode} from "react";
import {cn} from "@/lib/utils";

export function Card({className, children, interactive = false}: {className?: string; children: ReactNode; interactive?: boolean}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-card p-6 shadow-soft",
        interactive && "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Panel({className, children}: {className?: string; children: ReactNode}) {
  return <div className={cn("rounded-2xl border border-line bg-card", className)}>{children}</div>;
}

export function SectionLabel({children, className}: {children: ReactNode; className?: string}) {
  return (
    <span className={cn("text-[11px] font-bold uppercase tracking-[0.1em] text-ink-dim", className)}>{children}</span>
  );
}

export function Divider({className}: {className?: string}) {
  return <div className={cn("h-px w-full", "hairline", className)} />;
}

type TagTone = "neutral" | "brand" | "good" | "bad" | "agent" | "data" | "gold" | "info";

const TAG_TONE: Record<TagTone, string> = {
  neutral: "border-line text-ink-muted bg-ink/[0.03]",
  brand: "border-brand/20 text-brand bg-brand/[0.08]",
  good: "border-good/20 text-good bg-good/[0.08]",
  bad: "border-bad/20 text-bad bg-bad/[0.08]",
  agent: "border-agent/20 text-agent bg-agent/[0.08]",
  data: "border-data/20 text-data bg-data/[0.08]",
  gold: "border-gold/25 text-gold bg-gold/[0.08]",
  info: "border-info/20 text-info bg-info/[0.08]",
};

export function Tag({children, tone = "neutral", className}: {children: ReactNode; tone?: TagTone; className?: string}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        TAG_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "brand" | "ghost" | "danger";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  brand: "border-brand/25 bg-brand/[0.10] text-brand shadow-soft hover:bg-brand/[0.16] hover:border-brand/40",
  ghost: "border-line bg-card text-ink-muted shadow-soft hover:border-line-bright hover:text-ink",
  danger: "border-bad/25 bg-bad/[0.06] text-bad hover:bg-bad/[0.12]",
};

export function buttonClass(variant: ButtonVariant = "ghost", extra?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.98]",
    BUTTON_VARIANT[variant],
    extra,
  );
}

export function Button({
  children,
  variant = "ghost",
  className,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={buttonClass(variant, cn(disabled && "opacity-40", className))}>
      {children}
    </button>
  );
}

export function Skeleton({className}: {className?: string}) {
  return <div className={cn("skeleton animate-shimmer rounded-xl", className)} />;
}
