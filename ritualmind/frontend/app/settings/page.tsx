import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel} from "@/components/ui/primitives";
import {WalletSearch} from "@/components/wallet-search";
import {EXPLORER_URL} from "@/lib/chain";

export default function SettingsPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Ritual Mind does not require a wallet connection. You inspect any address by pasting it."
      />

      <div className="mt-8 max-w-2xl space-y-6">
        <Card>
          <SectionLabel>Address lookup</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            There is no account to configure and no permissions to grant. Paste a Ritual address to read its on chain
            data.
          </p>
          <div className="mt-4">
            <WalletSearch size="md" />
          </div>
        </Card>

        <Card>
          <SectionLabel>Data sources</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            All data is read live from the official Ritual RPC at rpc.ritualfoundation.org and can be verified on the
            explorer at {EXPLORER_URL.replace("https://", "")}. Reputation features that depend on the Ritual Mind
            contracts and scoring agent are shown as unavailable until those are deployed on chain.
          </p>
        </Card>
      </div>
    </Container>
  );
}
