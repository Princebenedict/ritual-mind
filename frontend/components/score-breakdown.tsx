"use client";

import {useState} from "react";
import {ChevronDown} from "lucide-react";
import type {WalletProfile} from "@/lib/types";
import {BAND_TEXT, bandFor, cn} from "@/lib/utils";

/**
 * Honest breakdown of a wallet's composite into its four on chain sub scores. Each row shows
 * the real score and its ceiling read from the WalletRegistry, plus a static description of
 * what the enclave measures for that component. The detailed per line point maths and the
 * attestation hashes are computed inside the enclave and are not stored on chain per
 * component, so they are described, never fabricated. Verifiable evidence for the whole
 * update is shown once, by the profile, from the real ScoreUpdated transaction.
 */
interface Section {
  key: string;
  name: string;
  score: number;
  max: number;
  measures: string;
}

function buildSections(profile: WalletProfile): Section[] {
  return [
    {
      key: "builder",
      name: "Builder",
      score: profile.builder,
      max: 400,
      measures:
        "Contract deployments, precompile usage, registered projects with genuine external adoption, and code quality audited by the enclave.",
    },
    {
      key: "advocate",
      name: "Advocate",
      score: profile.advocate,
      max: 300,
      measures:
        "Quality of technical content about Ritual Chain, scored by the enclave on depth, accuracy, and originality. Quality, not volume.",
    },
    {
      key: "community",
      name: "Community",
      score: profile.community,
      max: 200,
      measures: `Attestations received (${profile.attestationsReceived}) and given, verified contributions, and help given to other wallets.`,
    },
    {
      key: "user",
      name: "User",
      score: profile.user,
      max: 100,
      measures: "Distinct dApps used, active weeks, RITUAL held, and precompile use.",
    },
  ];
}

export function ScoreBreakdown({profile}: {profile: WalletProfile}) {
  const sections = buildSections(profile);
  const [open, setOpen] = useState<string | null>("builder");

  return (
    <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card">
      {sections.map((section) => {
        const isOpen = open === section.key;
        return (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : section.key)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-surface"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3">
                <ChevronDown size={16} className={cn("text-ink-dim transition-transform", isOpen && "rotate-180")} />
                <span className="text-sm font-bold">{section.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-sm font-bold", BAND_TEXT[bandFor(section.score, section.max)])}>
                  {section.score}
                </span>
                <span className="font-mono text-xs text-ink-dim">/ {section.max}</span>
              </div>
            </button>
            {isOpen ? (
              <div className="border-t border-line bg-bg-raised px-5 py-4">
                <p className="text-sm leading-relaxed text-ink-muted">{section.measures}</p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
