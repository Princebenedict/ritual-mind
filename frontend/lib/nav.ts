import {
  Boxes,
  Code2,
  Compass,
  Cpu,
  LayoutDashboard,
  LineChart,
  Package,
  ScrollText,
  Settings,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Overview" | "Discover" | "Intelligence" | "Build" | "Account";
}

export const NAV: NavItem[] = [
  {href: "/", label: "Home", icon: Sparkles, group: "Overview"},
  {href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview"},
  {href: "/explorer", label: "Explorer", icon: Compass, group: "Discover"},
  {href: "/leaderboard", label: "Leaderboard", icon: Trophy, group: "Discover"},
  {href: "/projects", label: "Projects", icon: Boxes, group: "Discover"},
  {href: "/analytics", label: "Analytics", icon: LineChart, group: "Intelligence"},
  {href: "/intel", label: "Intel", icon: ScrollText, group: "Intelligence"},
  {href: "/developers", label: "Developers", icon: Cpu, group: "Build"},
  {href: "/sdk", label: "SDK", icon: Package, group: "Build"},
  {href: "/settings", label: "Settings", icon: Settings, group: "Account"},
];

export const NAV_GROUPS: NavItem["group"][] = ["Overview", "Discover", "Intelligence", "Build", "Account"];

export function codeIcon(): LucideIcon {
  return Code2;
}
