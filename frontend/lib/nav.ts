import {
  Code2,
  Compass,
  Cpu,
  Package,
  Settings,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Discover" | "Build" | "Account";
}

export const NAV: NavItem[] = [
  {href: "/", label: "Home", icon: Sparkles, group: "Overview"},
  {href: "/explorer", label: "Explorer", icon: Compass, group: "Discover"},
  {href: "/leaderboard", label: "Leaderboard", icon: Trophy, group: "Discover"},
  {href: "/developers", label: "Developers", icon: Cpu, group: "Build"},
  {href: "/sdk", label: "SDK", icon: Package, group: "Build"},
  {href: "/settings", label: "Settings", icon: Settings, group: "Account"},
];

export const NAV_GROUPS: NavItem["group"][] = ["Overview", "Discover", "Build", "Account"];

export function codeIcon(): LucideIcon {
  return Code2;
}
