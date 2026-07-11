"use client";

import {ArrowUpRight} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {Skeleton, Tag} from "@/components/ui/primitives";
import {ProjectCard} from "@/components/project-card";
import {useProjects, useTotalProjects} from "@/lib/hooks";
import {CONTRACTS, explorerAddress} from "@/lib/chain";

export default function ProjectsPage() {
  const {data: total} = useTotalProjects();
  const {data: projects, isLoading, isError} = useProjects(50);

  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Ecosystem"
        title="Projects"
        description="Projects registered in the ProjectRegistry, with usage metrics measured by the agent. Every number is read from the contract, never estimated."
        actions={
          <a
            href={explorerAddress(CONTRACTS.projectRegistry)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand"
          >
            ProjectRegistry <ArrowUpRight size={13} />
          </a>
        }
      />

      <div className="mt-6 flex items-center justify-end">
        {typeof total === "number" ? <Tag tone="neutral">{total.toLocaleString("en-US")} registered</Tag> : null}
      </div>

      <div className="mt-4">
        {isError ? (
          <Unavailable title="Projects could not be read">
            The ProjectRegistry did not respond. Projects are only ever shown from a real contract read, so nothing is
            displayed until the read succeeds.
          </Unavailable>
        ) : isLoading || projects === undefined ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length: 6}).map((_, index) => (
              <Skeleton key={index} className="h-52" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Unavailable title="No projects registered yet">
            No project has been registered in the ProjectRegistry, so there is nothing to list. Registered projects and
            their real metrics appear here automatically. The registered count above is read live from the contract.
          </Unavailable>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.address} project={project} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
