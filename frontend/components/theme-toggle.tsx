"use client";

import {useEffect, useState} from "react";
import {Monitor, Moon, Sun} from "lucide-react";
import {useTheme} from "@/lib/theme";
import {cn} from "@/lib/utils";

/**
 * Theme control. Two shapes from one store so the top bar icon and the Settings segmented
 * control never drift. Mount gating keeps the first client render identical to the server
 * (dark) render, then syncs to whatever the pre-hydration script applied.
 */
export function ThemeToggle({variant = "icon"}: {variant?: "icon" | "segmented"}) {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const setTheme = useTheme((s) => s.setTheme);
  const sync = useTheme((s) => s.sync);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    sync();
    setMounted(true);
  }, [sync]);

  const active = mounted ? theme : "dark";

  if (variant === "segmented") {
    const options = [
      {value: "dark" as const, label: "Dark", icon: Moon},
      {value: "light" as const, label: "Light", icon: Sun},
    ];
    return (
      <div className="inline-flex items-center gap-1 rounded-xl border border-line bg-bg-base p-1" role="group" aria-label="Theme">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = active === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition-colors",
                isActive ? "bg-brand/[0.12] text-brand" : "text-ink-dim hover:text-ink",
              )}
            >
              <Icon size={15} strokeWidth={1.75} />
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={active === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-card text-ink-muted shadow-soft transition-all hover:border-line-bright hover:text-ink"
    >
      {mounted ? (
        active === "dark" ? (
          <Sun size={16} />
        ) : (
          <Moon size={16} />
        )
      ) : (
        <Monitor size={16} />
      )}
    </button>
  );
}
