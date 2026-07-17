"use client";

import {useMemo, useState} from "react";
import {ArrowUpRight, BadgeCheck, BookText, Boxes, Cpu, Github, Globe, Sparkles, Trophy, Wrench} from "lucide-react";
import type {LucideIcon} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {SectionLabel, Tag} from "@/components/ui/primitives";
import {ECOSYSTEM, ECO_CATEGORIES, type EcoCategory} from "@/lib/ecosystem";
import {explorerAddress} from "@/lib/chain";
import {cn} from "@/lib/utils";

const CATEGORY_ICON: Record<EcoCategory, LucideIcon> = {
  Infrastructure: Boxes,
  "AI Compute": Cpu,
  "Developer Tools": Wrench,
  Reputation: Trophy,
  Ecosystem: Sparkles,
};

type Filter = "All" | EcoCategory;

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>("All");

  const projects = useMemo(
    () => (filter === "All" ? ECOSYSTEM : ECOSYSTEM.filter((p) => p.category === filter)),
    [filter],
  );

  const filters: Filter[] = ["All", ...ECO_CATEGORIES];

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Ecosystem"
        title="Projects"
        description="Projects and infrastructure building on Ritual Chain, arranged by category. This is a curated directory — no registration and no wallet needed to appear."
      />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              filter === f ? "bg-brand/[0.12] text-brand" : "text-ink-dim hover:text-ink",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const Icon = CATEGORY_ICON[project.category];
          return (
            <div
              key={project.id}
              className="flex flex-col rounded-2xl border border-line bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand/[0.08] text-brand">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                {project.official ? (
                  <Tag tone="brand">
                    <BadgeCheck size={11} /> Official
                  </Tag>
                ) : (
                  <Tag tone="neutral">{project.category}</Tag>
                )}
              </div>

              <h3 className="mt-4 text-base font-bold text-ink">{project.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-muted">{project.summary}</p>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-brand hover:underline"
                >
                  <Globe size={13} /> Visit <ArrowUpRight size={11} />
                </a>
                {project.docs ? (
                  <a href={project.docs} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-muted hover:text-ink">
                    <BookText size={13} /> Docs
                  </a>
                ) : null}
                {project.github ? (
                  <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-muted hover:text-ink">
                    <Github size={13} /> GitHub
                  </a>
                ) : null}
                {project.contract ? (
                  <a
                    href={explorerAddress(project.contract)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-ink-dim hover:text-ink"
                  >
                    Contract <ArrowUpRight size={11} />
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-ink/[0.02] px-5 py-4">
        <SectionLabel>Add a project</SectionLabel>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          This directory is a plain data file, not a registry, so anyone building on Ritual can be listed without signing
          up. Add an entry in <span className="font-mono text-ink">lib/ecosystem.ts</span> and it appears here on the next
          deploy. Nothing here reports usage metrics — only real links you can verify.
        </p>
      </div>
    </Container>
  );
}
