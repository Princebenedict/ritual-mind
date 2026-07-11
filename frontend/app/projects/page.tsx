import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";

export default function ProjectsPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Ecosystem"
        title="Projects"
        description="Projects registered on Ritual Mind, with agent measured usage metrics."
      />
      <div className="mt-6">
        <Unavailable title="Project registry is not live yet">
          Project metrics come from the ProjectRegistry contract and the scoring agent, which are not deployed. No usage
          numbers are estimated or invented. Once the registry is live, registered projects and their real metrics appear
          here.
        </Unavailable>
      </div>
    </Container>
  );
}
