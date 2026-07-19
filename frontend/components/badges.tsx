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

const ACCENT_DOT: Record<BadgeDefinition["accent"], string> = {
  brand: "bg-brand",
  good: "bg-good",
  agent: "bg-agent",
  data: "bg-data",
  gold: "bg-gold",
  info: "bg-info",
};

/**
 * Overall badge completion for a wallet, derived only from on chain badge ownership. The
 * percentage is earned badges over the ten total soulbound badges, so 100 percent means every
 * badge has been minted to this wallet. Nothing here is estimated. Each pip maps to one badge
 * and fills with the badge color once that badge is held.
 */
export function BadgeProgress({earned}: {earned: number[]}) {
  const total = BADGES.length;
  const earnedCount = BADGES.filter((badge) => earned.includes(badge.id)).length;
  const pct = Math.round((earnedCount / total) * 100);
  const complete = earnedCount === total;

  const size = 104;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;

  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div className="relative shrink-0" style={{width: size, height: size}}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-ink/10" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - filled}
              className={cn("transition-all duration-500", complete ? "stroke-good" : "stroke-brand")}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold tabular text-ink">{pct}%</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-dim">complete</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="font-mono text-sm font-bold tabular text-ink">
            {earnedCount} of {total} badges earned
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            {complete
              ? "Every soulbound badge has been minted to this wallet."
              : `${total - earnedCount} badges are still available. Each is minted on chain when this wallet crosses its threshold.`}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {BADGES.map((badge) => (
              <span
                key={badge.id}
                title={badge.title}
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  earned.includes(badge.id) ? ACCENT_DOT[badge.accent] : "bg-ink/10",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeMark({accent, earned}: {accent: BadgeDefinition["accent"]; earned: boolean}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border",
        earned ? `h-11 w-11 ${ACCENT_RING[accent]}` : "h-9 w-9 border-line text-ink-dim",
      )}
    >
      <svg
        width={earned ? 20 : 16}
        height={earned ? 20 : 16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      >
        <path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
        <path d="M12 8.5 15 10v4l-3 1.5L9 14v-4l3-1.5Z" />
      </svg>
    </div>
  );
}

/** An earned badge, shown prominently with its full color, on chain earn date, and the concrete
 *  condition it certifies. The earn date is the block timestamp recorded by BadgeNFT when the
 *  ScoreOracle minted it, so it is verifiable on chain. */
function EarnedBadge({badge, earnedAt}: {badge: BadgeDefinition; earnedAt: number}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-soft">
      <BadgeMark accent={badge.accent} earned />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-bold text-ink">{badge.title}</span>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{badge.description}</p>
        <div className="mt-1.5 font-mono text-[11px] text-ink-dim">
          {earnedAt > 0 ? `Earned ${formatDateUtc(earnedAt)}` : "Earned"}. Soulbound, minted on chain.
        </div>
      </div>
    </div>
  );
}

/** A not yet earned badge, shown muted and smaller. Its description states the concrete on chain
 *  condition that would mint it, and the requirement line restates that threshold in short form. */
function LockedBadge({badge}: {badge: BadgeDefinition}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line bg-ink/[0.03] p-3">
      <BadgeMark accent={badge.accent} earned={false} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-ink-muted">{badge.title}</span>
          <Lock size={11} className="text-ink-dim" />
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-dim">{badge.description}</p>
        <div className="mt-1 font-mono text-[10px] text-ink-dim">{badge.requirement}</div>
      </div>
    </div>
  );
}

export function BadgeGrid({earned, earnedAt}: {earned: number[]; earnedAt: Record<number, number>}) {
  const earnedBadges = BADGES.filter((badge) => earned.includes(badge.id));
  const lockedBadges = BADGES.filter((badge) => !earned.includes(badge.id));

  return (
    <div className="space-y-6">
      {earnedBadges.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {earnedBadges.map((badge) => (
            <EarnedBadge key={badge.id} badge={badge} earnedAt={earnedAt[badge.id] ?? 0} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">
          No badges earned yet. Badges are soulbound and minted by the ScoreOracle when this wallet crosses a
          threshold. Each is verifiable on chain.
        </p>
      )}

      {lockedBadges.length > 0 ? (
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">Not yet earned</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {lockedBadges.map((badge) => (
              <LockedBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
