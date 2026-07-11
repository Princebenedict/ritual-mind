import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";

export default function SocialPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Intelligence"
        title="Social pulse"
        description="How the ecosystem is talked about, scored for quality inside the enclave."
      />
      <div className="mt-6">
        <Unavailable title="Social intelligence is not live yet">
          Social content is fetched and scored by the agent inside a trusted execution environment, and the results are
          written on chain. The agent is not running and there is no on chain source, so nothing is shown. No sentiment,
          advocate, or content figures are invented.
        </Unavailable>
      </div>
    </Container>
  );
}
