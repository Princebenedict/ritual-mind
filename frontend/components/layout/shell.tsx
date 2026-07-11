"use client";

import {type ReactNode, useEffect} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {Boxes, Compass, LayoutDashboard, Sparkles, Trophy} from "lucide-react";
import {Sidebar} from "./sidebar";
import {Topbar} from "./topbar";
import {CommandPalette} from "./command-palette";
import {Assistant} from "./assistant";
import {useUI} from "@/lib/store";
import {cn} from "@/lib/utils";

const MOBILE_NAV = [
  {href: "/", label: "Home", icon: Sparkles},
  {href: "/explorer", label: "Explorer", icon: Compass},
  {href: "/leaderboard", label: "Ranks", icon: Trophy},
  {href: "/projects", label: "Projects", icon: Boxes},
  {href: "/dashboard", label: "You", icon: LayoutDashboard},
];

export function Shell({children}: {children: ReactNode}) {
  const toggleCommand = useUI((state) => state.toggleCommand);
  const setCommandOpen = useUI((state) => state.setCommandOpen);
  const setAssistantOpen = useUI((state) => state.setAssistantOpen);
  const pathname = usePathname();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommand();
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setAssistantOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCommand, setCommandOpen, setAssistantOpen]);

  return (
    <div className="relative z-10 flex min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:border focus:border-line-bright focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-line bg-bg-raised/95 backdrop-blur-md lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-brand" : "text-ink-dim",
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <CommandPalette />
      <Assistant />
    </div>
  );
}
