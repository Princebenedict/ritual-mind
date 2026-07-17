import {Lock} from "lucide-react";
import {BADGES, type BadgeDefinition} from "@/lib/badges";
import {formatDateUtc, cn} from "@/lib/utils";

const ACCENT_RING: Record<BadgeDefinition["accent"], string> = {
  brand: "border-brand/40 text-brand",
  good: "border-good/40 text-good",
  agent: "border-agent/40 text-agent",
  data: "border-data/40 text-data",
  gold: "border-gold/40 text-gold",
  info: "border-info/40 text-info",
};

function BadgeMark({accent, earned}: {accent: BadgeDefinition["accent"]; earned: boolean}) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 items-center justify-center rounded-xl border",
        earned ? ACCENT_RING[accent] : "border-line text-ink-dim",
      )}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
        <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
        <path d="M12 8.5 15 10v4l-3 1.5L9 14v-4l3-1.5Z" />
      </svg>
    </div>
  );
}

export function BadgeGrid({earned, earnedAt}: {earned: number[]; earnedAt: Record<number, number>}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {BADGES.map((badge) => {
        const isEarned = earned.includes(badge.id);
        return (
          <div
            key={badge.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
              isEarned ? "border-line bg-card shadow-soft" : "border-line bg-ink/[0.03] opacity-70",
            )}
          >
            <BadgeMark accent={badge.accent} earned={isEarned} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-bold", isEarned ? "text-ink" : "text-ink-muted")}>{badge.title}</span>
                {!isEarned ? <Lock size={12} className="text-ink-dim" /> : null}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{badge.description}</p>
              <div className="mt-1.5 font-mono text-[11px] text-ink-dim">
                {isEarned ? `Earned ${formatDateUtc(earnedAt[badge.id] ?? 0)}` : badge.requirement}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
