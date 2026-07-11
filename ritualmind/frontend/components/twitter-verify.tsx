"use client";

import {useState} from "react";
import {BadgeCheck, Copy, Twitter} from "lucide-react";
import {buttonClass} from "@/components/ui/primitives";

/**
 * Twitter verification flow. A wallet claims a handle, posts a one time phrase, and the
 * agent confirms ownership on its next cycle. This component drives the client side of
 * that flow. In live mode the phrase is derived from the wallet and the confirmation is
 * read from the WalletRegistry.
 */
export function TwitterVerify({handle, verified}: {handle: string | null; verified: boolean}) {
  const [started, setStarted] = useState(false);
  const phrase = handle !== null ? `Verifying ${handle} for Ritual Mind. ref 0x${handle.length.toString(16)}a7c3` : "";

  if (verified && handle !== null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-good/20 bg-good/5 px-3 py-2 text-sm text-good">
        <BadgeCheck size={16} />
        <span className="font-mono">{handle}</span>
        <span className="text-xs text-ink-muted">verified by the enclave</span>
      </div>
    );
  }

  if (handle === null) {
    return (
      <div className="rounded-lg border border-line bg-surface px-4 py-3">
        <p className="text-sm text-ink-muted">No handle linked. Connect this wallet and link a handle to begin verification.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-sm">
        <Twitter size={15} className="text-info" />
        <span className="font-mono text-ink">{handle}</span>
        <span className="text-xs text-gold">pending verification</span>
      </div>
      {started ? (
        <div className="mt-3">
          <p className="text-xs text-ink-muted">Post this exact phrase from {handle}. The agent confirms it on the next cycle.</p>
          <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-bg-raised px-3 py-2">
            <code className="flex-1 font-mono text-xs text-ink">{phrase}</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(phrase).catch(() => undefined)}
              aria-label="Copy phrase"
              className="text-ink-dim hover:text-ink"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setStarted(true)} className={buttonClass("ghost", "mt-3 h-9")}>
          Start verification
        </button>
      )}
    </div>
  );
}
