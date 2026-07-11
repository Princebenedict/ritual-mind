import {Container, PageHeader} from "@/components/page";
import {NetworkStatus} from "@/components/network-status";
import {Unavailable} from "@/components/unavailable";

export default function AnalyticsPage() {
  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Intelligence"
        title="Analytics"
        description="Live Ritual Network measures from the RPC. Reputation analytics go live with the Ritual Mind contracts."
      />

      <div className="mt-6">
        <NetworkStatus />
      </div>

      <div className="mt-8">
        <Unavailable title="Reputation analytics are not live yet">
          Ecosystem measures such as score distribution, precompile adoption per wallet, and attestation density are
          derived from the Ritual Mind contracts, which are not deployed. Only the live network figures above are real
          today. None of the reputation measures are estimated.
        </Unavailable>
      </div>
    </Container>
  );
}
