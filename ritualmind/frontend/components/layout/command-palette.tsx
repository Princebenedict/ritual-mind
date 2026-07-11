"use client";

import {useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {AnimatePresence, motion} from "framer-motion";
import {ArrowRight, Search, Wallet} from "lucide-react";
import {useUI} from "@/lib/store";
import {NAV} from "@/lib/nav";
import {isValidAddress, shortHash} from "@/lib/rpc";

interface Result {
  id: string;
  label: string;
  hint: string;
  href: string;
  kind: "page" | "address";
}

export function CommandPalette() {
  const open = useUI((state) => state.commandOpen);
  const setOpen = useUI((state) => state.setCommandOpen);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const results = useMemo<Result[]>(() => {
    const q = query.trim();
    const pages: Result[] = NAV.map((item) => ({
      id: `page-${item.href}`,
      label: item.label,
      hint: item.group,
      href: item.href,
      kind: "page",
    }));

    if (isValidAddress(q)) {
      return [{id: "address", label: "Open address", hint: shortHash(q, 10, 8), href: `/wallet/${q}`, kind: "address"}];
    }
    if (q.length === 0) return pages;
    const lower = q.toLowerCase();
    return pages.filter((page) => page.label.toLowerCase().includes(lower) || page.hint.toLowerCase().includes(lower));
  }, [query]);

  const select = (result: Result) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.15}}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <motion.div
            initial={{opacity: 0, y: -8, scale: 0.99}}
            animate={{opacity: 1, y: 0, scale: 1}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.18, ease: [0.16, 1, 0.3, 1]}}
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-black/[0.08] bg-white shadow-soft-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const first = results[0];
                if (first !== undefined) select(first);
              }}
              className="flex items-center gap-3 border-b border-black/[0.06] px-5"
            >
              <Search size={16} className="text-ink-dim" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Paste an address, or search pages"
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim"
              />
              <kbd className="rounded-lg border border-black/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">Esc</kbd>
            </form>
            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-ink-dim">No matches.</li>
              ) : (
                results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => select(result)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
                    >
                      {result.kind === "address" ? (
                        <Wallet size={15} className="text-brand" />
                      ) : (
                        <ArrowRight size={15} className="text-ink-dim" />
                      )}
                      <span className="flex-1 text-sm text-ink">{result.label}</span>
                      <span className="font-mono text-xs text-ink-dim">{result.hint}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
