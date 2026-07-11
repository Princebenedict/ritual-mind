import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel} from "@/components/ui/primitives";
import {CodeBlock} from "@/components/code-block";

const INSTALL = `npm install @ritualmind/sdk viem`;

const USAGE = `import {createRitualMind} from "@ritualmind/sdk";

const mind = createRitualMind({
  rpcUrl: "https://rpc.ritualfoundation.org",
  walletRegistry: "0xWALLET_REGISTRY",
  projectRegistry: "0xPROJECT_REGISTRY",
  badgeNFT: "0xBADGE_NFT",
  activityEmitter: "0xACTIVITY_EMITTER",
});

const score = await mind.getScore("0xWALLET");
// {composite, builder, advocate, community, user, globalRank}

const isBuilder = await mind.isVerifiedBuilder("0xWALLET");
const badges = await mind.getBadges("0xWALLET");
const top = await mind.getTopWallets(25);
const metrics = await mind.getProjectMetrics("0xPROJECT");`;

const EXPORTS = [
  {name: "getScore", signature: "(wallet) => Promise<Score>", description: "The full profile with the four sub scores, composite, and rank."},
  {name: "isVerifiedBuilder", signature: "(wallet) => Promise<boolean>", description: "Whether the wallet holds verified builder status."},
  {name: "getBadges", signature: "(wallet) => Promise<Badge[]>", description: "The soulbound badges the wallet has earned, with earned timestamps."},
  {name: "getProjectMetrics", signature: "(address) => Promise<ProjectMetrics>", description: "Weekly active wallets, health, growth, and verification for a project."},
  {name: "registerProject", signature: "(params, walletClient) => Promise<Hash>", description: "Register a project. Requires a wallet client to send the transaction."},
  {name: "emitActivity", signature: "(params, walletClient) => Promise<Hash>", description: "Emit a feed event from an authorized writer contract or address."},
  {name: "getTopWallets", signature: "(count) => Promise<Score[]>", description: "The top wallets by composite, ready for a leaderboard."},
];

export default function SdkPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Build"
        title="Integration SDK"
        description="A typed TypeScript client for reading Ritual Mind. It reads deployed contracts through a viem public client and returns fully typed results."
      />

      <div className="mt-8 space-y-6">
        <div>
          <div className="mb-3">
            <SectionLabel>Install</SectionLabel>
          </div>
          <CodeBlock code={INSTALL} language="bash" filename="terminal" />
        </div>

        <div>
          <div className="mb-3">
            <SectionLabel>Usage</SectionLabel>
          </div>
          <CodeBlock code={USAGE} language="ts" filename="example.ts" />
        </div>

        <div>
          <div className="mb-3">
            <SectionLabel>Exports</SectionLabel>
          </div>
          <Card className="p-0">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-line">
                {EXPORTS.map((item) => (
                  <tr key={item.name} className="align-top">
                    <td className="w-56 px-5 py-4">
                      <div className="font-mono text-sm text-brand">{item.name}</div>
                      <div className="mt-1 font-mono text-[11px] text-ink-dim">{item.signature}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-ink-muted">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </Container>
  );
}
