"use client";

import {useState} from "react";
import {ChevronDown, ExternalLink} from "lucide-react";
import type {WalletProfile} from "@/lib/types";
import {BAND_TEXT, bandFor, cn} from "@/lib/utils";

interface Line {
  label: string;
  points: string;
}

interface Section {
  key: string;
  name: string;
  score: number;
  max: number;
  lines: Line[];
  attestation: string;
}

function buildSections(profile: WalletProfile): Section[] {
  return [
    {
      key: "builder",
      name: "Builder",
      score: profile.builder,
      max: 400,
      attestation: "0x9f21ac4b",
      lines: [
        {label: `Contracts deployed (${profile.contractsDeployed})`, points: `+${Math.min(profile.contractsDeployed, 5) * 25}`},
        {label: `Unique precompiles used (${profile.precompilesUsed})`, points: `+${Math.min(profile.precompilesUsed, 5) * 30}`},
        {label: "Registered project, active", points: profile.isVerifiedBuilder ? "+40" : "0"},
        {label: "External usage and code quality", points: "audited"},
      ],
    },
    {
      key: "advocate",
      name: "Advocate",
      score: profile.advocate,
      max: 300,
      attestation: "0x55cd12e0",
      lines: [
        {label: "Quality weighted content", points: "LLM scored"},
        {label: "Reach multiplier", points: "by impressions"},
        {label: `Weekly streak (${profile.weeklyStreak}w)`, points: `x${Math.pow(1.1, Math.min(profile.weeklyStreak, 20)).toFixed(2)}`},
      ],
    },
    {
      key: "community",
      name: "Community",
      score: profile.community,
      max: 200,
      attestation: "0x71be0390",
      lines: [
        {label: `Attestations received (${profile.attestationsReceived})`, points: "+8 or +3 each"},
        {label: `Attestations given (${profile.attestationsGiven})`, points: `+${profile.attestationsGiven * 2}`},
        {label: "Verified forum and debug help", points: "+5 to +10"},
      ],
    },
    {
      key: "user",
      name: "User",
      score: profile.user,
      max: 100,
      attestation: "0x2ad9f1c7",
      lines: [
        {label: "Unique dApps used", points: "+5 each"},
        {label: "Weekly active weeks", points: "+3 each"},
        {label: "RITUAL held", points: "tiered"},
      ],
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
              <div className="space-y-2 border-t border-line bg-bg-raised px-5 py-4">
                {section.lines.map((line, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">{line.label}</span>
                    <span className="font-mono text-xs text-ink">{line.points}</span>
                  </div>
                ))}
                <a
                  href={`https://explorer.ritualfoundation.org/tx/${section.attestation}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-good hover:underline"
                >
                  <ExternalLink size={12} />
                  TEE attestation {section.attestation}
                </a>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
