"use client";

import {useState} from "react";
import {Check, Copy, ExternalLink} from "lucide-react";
import {explorerAddress} from "@/lib/chain";
import {shortAddress, cn} from "@/lib/utils";

/** Truncated address in monospace with copy and explorer affordances. */
export function MonoAddress({
  address,
  className,
  withLinks = true,
  lead = 6,
  tail = 4,
}: {
  address: string;
  className?: string;
  withLinks?: boolean;
  lead?: number;
  tail?: number;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted", className)}>
      <span>{shortAddress(address, lead, tail)}</span>
      {withLinks ? (
        <>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy address"
            className="text-ink-dim transition-colors hover:text-ink"
          >
            {copied ? <Check size={13} className="text-good" /> : <Copy size={13} />}
          </button>
          <a
            href={explorerAddress(address)}
            target="_blank"
            rel="noreferrer"
            aria-label="View on explorer"
            className="text-ink-dim transition-colors hover:text-ink"
          >
            <ExternalLink size={13} />
          </a>
        </>
      ) : null}
    </span>
  );
}
