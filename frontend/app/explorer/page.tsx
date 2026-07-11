import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel} from "@/components/ui/primitives";
import {WalletSearch} from "@/components/wallet-search";
import {LiveFeed} from "@/components/feed";

export default function ExplorerPage() {
  return (
    <Container className="pb-16" wide>
      <PageHeader
        eyebrow="Directory"
        title="Explorer"
        description="Inspect any Ritual address and watch live network activity. Both are read directly from the RPC."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="h-fit">
          <SectionLabel>Inspect an address</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Paste any Ritual address to read its real balance, outgoing transaction count, and account type. A scored
            directory of every wallet requires the reputation layer, which is not live yet, so it is not shown.
          </p>
          <div className="mt-4">
            <WalletSearch size="md" />
          </div>
        </Card>

        <LiveFeed limit={14} />
      </div>
    </Container>
  );
}
