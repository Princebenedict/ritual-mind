"use client";

import Link from "next/link";
import {useParams} from "next/navigation";
import {isAddress} from "viem";
import {ArrowUpRight, Github, Globe, ShieldCheck} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {Card, SectionLabel, Skeleton, Tag} from "@/components/ui/primitives";
import {EvidenceBar} from "@/components/evidence";
import {MonoAddress} from "@/components/ui/mono";
import {useProject} from "@/lib/hooks";
import {contractEvidence} from "@/lib/contracts";
import {explorerAddress} from "@/lib/chain";
import {compact, formatDateUtc} from "@/lib/utils";
import type {Address} from "@/lib/types";

function Metric({label, value, tone}: {label: string; value: string; tone?: string}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">{label}</div>
      <div className={`mt-2 font-mono text-lg font-bold tabular ${tone ?? "text-ink"}`}>{value}</div>
    </div>
  );
}

export default function ProjectPage() {
  const params = useParams<{address: string}>();
  const address = params.address;
  const valid = isAddress(address);
  const {data: project, isLoading, isError} = useProject(valid ? address : "");

  if (!valid) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg">
          <Unavailable title="Not a valid address">
            The value in the URL is not a well formed contract address. A valid address is a 42 character 0x value.
          </Unavailable>
        </div>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-8" wide>
        <Skeleton className="h-40 w-full" />
      </Container>
    );
  }

  if (isError || project === null || project === undefined) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg">
          <Unavailable title="Not a registered project">
            This contract is not registered in the ProjectRegistry, so there are no project metrics to show. Nothing is
            estimated. You can still read its real on chain data as an{" "}
            <Link href={`/wallet/${address}`} className="text-brand hover:underline">
              address
            </Link>
            .
          </Unavailable>
        </div>
      </Container>
    );
  }

  const growthUp = project.growthRate >= 0;

  return (
    <Container className="py-8" wide>
      <PageHeader
        eyebrow={project.category}
        title={project.name}
        description={project.description}
        actions={
          <div className="flex items-center gap-2">
            {project.isVerified ? (
              <Tag tone="good">
                <ShieldCheck size={12} /> verified
              </Tag>
            ) : null}
            {project.isActive ? <Tag tone="brand">active</Tag> : <Tag tone="neutral">inactive</Tag>}
          </div>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        {project.url.length > 0 ? (
          <a href={project.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline">
            <Globe size={14} /> Website
          </a>
        ) : null}
        {project.repoUrl.length > 0 ? (
          <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline">
            <Github size={14} /> Repository
          </a>
        ) : null}
        <a href={explorerAddress(project.address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:underline">
          <ArrowUpRight size={14} /> Contract on explorer
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Weekly active" value={compact(project.weeklyActiveWallets)} />
        <Metric label="Total txns" value={compact(project.totalTxns)} />
        <Metric label="Health" value={`${project.healthScore} / 1000`} />
        <Metric label="Community" value={`${project.communityScore} / 1000`} />
        <Metric
          label="Growth"
          value={`${growthUp ? "+" : ""}${(project.growthRate / 100).toFixed(1)}%`}
          tone={growthUp ? "text-good" : "text-bad"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionLabel>Deployer</SectionLabel>
          <div className="mt-2">
            <MonoAddress address={project.deployer} lead={12} tail={10} />
          </div>
          <div className="mt-3 text-sm text-ink-muted">
            Registered {formatDateUtc(project.registeredAt)}. Metrics are maintained by the agent and written to the
            ProjectRegistry.
          </div>
        </Card>
        <Card>
          <SectionLabel>Verify</SectionLabel>
          <div className="mt-3">
            <EvidenceBar evidence={contractEvidence(project.address as Address)} label="Read from ProjectRegistry" />
          </div>
        </Card>
      </div>
    </Container>
  );
}
