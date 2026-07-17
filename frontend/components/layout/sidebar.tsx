"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {motion} from "framer-motion";
import {Logo} from "@/components/icons";
import {NAV, NAV_GROUPS} from "@/lib/nav";
import {cn} from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 hidden h-screen shrink-0 p-3 lg:block">
      <aside className="flex h-full w-56 flex-col rounded-3xl border border-line bg-card shadow-soft">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-brand/15 bg-brand/[0.08] text-brand">
            <Logo size={18} />
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">Ritual Mind</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          {NAV_GROUPS.map((group) => (
            <div key={group} className="mb-6">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-dim">{group}</div>
              <ul className="space-y-1">
                {NAV.filter((item) => item.group === group).map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href} className="relative">
                      {active ? (
                        <motion.span
                          layoutId="sidebar-active"
                          transition={{type: "spring", stiffness: 380, damping: 32}}
                          className="absolute inset-0 rounded-xl border border-brand/15 bg-brand/[0.08]"
                        />
                      ) : null}
                      <Link
                        href={item.href}
                        className={cn(
                          "relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                          active ? "text-brand" : "text-ink-muted hover:bg-ink/[0.04] hover:text-ink",
                        )}
                      >
                        <Icon size={17} strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-3 rounded-2xl border border-line bg-ink/[0.03] px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-ink-dim">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-good/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
            </span>
            <span>Chain 1979 connected</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
