import type {FeedKind} from "@/lib/types";
import {
  Activity,
  Award,
  BadgeCheck,
  Boxes,
  FileCode2,
  Handshake,
  Radio,
  ScrollText,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

/**
 * The Ritual Mind brand mark. A custom geometric figure built on a 24 unit grid with a
 * 1.5 unit stroke. Concentric arcs suggest a scored ring around a single mind node. No
 * emoji anywhere in the product. Icons are this mark or lucide outline icons.
 */
export function Logo({className, size = 24}: {className?: string; size?: number}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.25" />
      <path d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5" />
      <path d="M12 6.75a5.25 5.25 0 0 1 5.25 5.25" />
      <path d="M12 20.5A8.5 8.5 0 0 1 3.5 12" />
      <path d="M12 17.25A5.25 5.25 0 0 1 6.75 12" />
    </svg>
  );
}

const FEED_ICONS: Record<FeedKind, LucideIcon> = {
  ScoreUpdated: Activity,
  ContractDeployed: FileCode2,
  ProjectRegistered: Boxes,
  AttestationGiven: Handshake,
  BadgeEarned: Award,
  AgentExecution: Radio,
  SocialMilestone: BadgeCheck,
  DigestPosted: ScrollText,
  WalletFlagged: ShieldAlert,
};

export function feedIcon(kind: FeedKind): LucideIcon {
  return FEED_ICONS[kind];
}

const FEED_ACCENT: Record<FeedKind, string> = {
  ScoreUpdated: "text-brand",
  ContractDeployed: "text-data",
  ProjectRegistered: "text-info",
  AttestationGiven: "text-good",
  BadgeEarned: "text-gold",
  AgentExecution: "text-agent",
  SocialMilestone: "text-good",
  DigestPosted: "text-agent",
  WalletFlagged: "text-bad",
};

export function feedAccent(kind: FeedKind): string {
  return FEED_ACCENT[kind];
}
