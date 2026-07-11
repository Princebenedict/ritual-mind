import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";

export default function FounderPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Operate"
        title="Founder studio"
        description="Growth and contributor intelligence derived from on chain reputation."
      />
      <div className="mt-6">
        <Unavailable title="No verifiable data yet">
          Founder analytics are produced by the Ritual Mind oracle and the scoring agent from on chain reputation data.
          Those contracts are not deployed to Ritual Network and the agent is not running, so there is nothing verifiable
          to show. This view will populate only once the reputation layer is live on chain.
        </Unavailable>
      </div>
    </Container>
  );
}
