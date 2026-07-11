import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";

export default function IntelPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Intelligence"
        title="Intel"
        description="Daily ecosystem briefs written by the agent and attested on chain."
      />
      <div className="mt-6">
        <Unavailable title="Intel is not live yet">
          Daily digests are written by the LLM inside the enclave and posted on chain with an attestation hash and an
          IPFS reference. The agent is not running, so there are no digests to show. Nothing here is fabricated.
        </Unavailable>
      </div>
    </Container>
  );
}
