import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel} from "@/components/ui/primitives";
import {ThemeToggle} from "@/components/theme-toggle";
import {EXPLORER_URL} from "@/lib/chain";

export default function SettingsPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Ritual Mind needs no account, no sign up, and no wallet connection. These are local preferences, saved in this browser only."
      />

      <div className="mt-8 max-w-2xl space-y-6">
        <Card>
          <SectionLabel>Appearance</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Choose the theme. Dark is the default and matches Ritual&apos;s native look; light is available if it is
            easier on your eyes. Your choice is remembered on this device.
          </p>
          <div className="mt-4">
            <ThemeToggle variant="segmented" />
          </div>
        </Card>

        <Card>
          <SectionLabel>No wallet, no registration</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            You never connect a wallet or register anything here. To inspect an address, paste it into the search at the
            top or on the Explorer. Reputation scores are computed by the agent from public on-chain activity. Wallets
            are discovered and scored automatically, so there is nothing for a person to sign up for.
          </p>
        </Card>

        <Card>
          <SectionLabel>Data sources</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Network data is read live from the official Ritual RPC at rpc.ritualfoundation.org and can be verified on the
            explorer at {EXPLORER_URL.replace("https://", "")}. Reputation reads straight from the Ritual Mind contracts
            on chain and fills in as the agent scans the network and scores wallets.
          </p>
        </Card>
      </div>
    </Container>
  );
}
