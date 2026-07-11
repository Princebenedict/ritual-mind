"use client";

import {useState} from "react";
import {Check, Copy} from "lucide-react";

export function CodeBlock({code, language = "ts", filename}: {code: string; language?: string; filename?: string}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      })
      .catch(() => setCopied(false));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-bg-sunken">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <span className="font-mono text-[11px] text-ink-dim">{filename ?? language}</span>
        <button type="button" onClick={copy} aria-label="Copy code" className="flex items-center gap-1.5 text-[11px] text-ink-dim transition-colors hover:text-ink">
          {copied ? <Check size={13} className="text-good" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4">
        <code className="font-mono text-[13px] leading-relaxed text-ink-muted">{code}</code>
      </pre>
    </div>
  );
}
