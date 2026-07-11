import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel} from "@/components/ui/primitives";
import {NetworkStatus} from "@/components/network-status";
import {LiveFeed} from "@/components/feed";
import {WalletSearch} from "@/components/wallet-search";

export default function DashboardPage() {
  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Live Ritual Network status and activity, read directly from the RPC. Paste any address to inspect its real on chain data. No wallet connection is required."
      />

      <div className="mt-6">
        <NetworkStatus />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="h-fit">
          <SectionLabel>Inspect an address</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Paste any Ritual address to read its real balance, outgoing transaction count, and account type. Every value
            links to the official explorer so you can verify it independently.
          </p>
          <div className="mt-4">
            <WalletSearch size="md" />
          </div>
        </Card>

        <LiveFeed limit={12} />
      </div>
    </Container>
  );
}
