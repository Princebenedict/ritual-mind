"use client";

import {Command, Search, Sparkles} from "lucide-react";
import {useUI} from "@/lib/store";
import {ThemeToggle} from "@/components/theme-toggle";

/**
 * Top bar. There is no wallet connection. The product reads on chain data from a pasted
 * address, so the bar holds search, the theme toggle, and the assistant only.
 */
export function Topbar() {
  const setCommandOpen = useUI((state) => state.setCommandOpen);
  const toggleAssistant = useUI((state) => state.toggleAssistant);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg-base/70 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="group flex h-11 flex-1 items-center gap-2.5 rounded-2xl border border-line bg-card px-4 text-sm text-ink-dim shadow-soft transition-all hover:border-line-bright hover:text-ink-muted sm:max-w-md"
      >
        <Search size={16} />
        <span className="flex-1 text-left">Search an address, or navigate</span>
        <kbd className="hidden items-center gap-0.5 rounded-lg border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-dim sm:flex">
          <Command size={10} /> K
        </kbd>
      </button>

      <ThemeToggle />

      <button
        type="button"
        onClick={() => toggleAssistant()}
        aria-label="Open assistant"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-card text-ink-muted shadow-soft transition-all hover:border-agent/40 hover:bg-agent/[0.06] hover:text-agent"
      >
        <Sparkles size={16} />
      </button>
    </header>
  );
}
