import Link from "next/link";
import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel, buttonClass} from "@/components/ui/primitives";
import {CodeBlock} from "@/components/code-block";

const CHAIN_SNIPPET = `import {defineChain} from "viem";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Testnet",
  nativeCurrency: {name: "RITUAL", symbol: "RITUAL", decimals: 18},
  rpcUrls: {default: {http: ["https://rpc.ritualfoundation.org"]}},
  blockExplorers: {default: {name: "Ritual Explorer", url: "https://explorer.ritualfoundation.org"}},
});`;

const READ_SNIPPET = `import {createRitualMind} from "@ritualmind/sdk";

const mind = createRitualMind({
  walletRegistry: process.env.NEXT_PUBLIC_WALLET_REGISTRY,
});

const score = await mind.getScore("0xWALLET");
const verified = await mind.isVerifiedBuilder("0xWALLET");`;

const FEED_SNIPPET = `import {createPublicClient, webSocket, parseAbiItem} from "viem";
import {ritualChain} from "./chain";

const client = createPublicClient({chain: ritualChain, transport: webSocket()});

client.watchEvent({
  address: process.env.NEXT_PUBLIC_ACTIVITY_EMITTER,
  event: parseAbiItem("event ScoreUpdated(address indexed wallet, uint256 composite, int256 delta, bytes32 attestationHash)"),
  onLogs: (logs) => {
    for (const log of logs) {
      // update your live feed
    }
  },
});`;

const STEPS = [
  {n: "01", title: "Configure the chain", body: "Point viem or wagmi at chain 1979. Ritual requires EIP-1559 transactions.", code: CHAIN_SNIPPET, lang: "ts"},
  {n: "02", title: "Read reputation", body: "Use the SDK to read scores, verified builder status, and badges for any wallet.", code: READ_SNIPPET, lang: "ts"},
  {n: "03", title: "Watch the live feed", body: "Subscribe to the ActivityEmitter over WebSocket for real time ecosystem events.", code: FEED_SNIPPET, lang: "ts"},
];

export default function DevelopersPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Build"
        title="Developers"
        description="Bring attested reputation into your Ritual Chain application. Read scores, badges, and project metrics, and subscribe to the live feed."
        actions={
          <Link href="/sdk" className={buttonClass("brand")}>
            SDK reference
          </Link>
        }
      />

      <div className="mt-8 space-y-8">
        {STEPS.map((step) => (
          <Card key={step.n}>
            <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
              <div>
                <div className="font-mono text-sm text-brand">{step.n}</div>
                <h2 className="mt-2 text-lg font-bold">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </div>
              <CodeBlock code={step.code} language={step.lang} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <SectionLabel>Async precompiles</SectionLabel>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Ritual Mind reads are standard view calls, so they are synchronous. When you build your own precompile
          consumers, remember that HTTP and LLM calls are short running async precompiles. The result is delivered in the
          transaction receipt spcCalls field rather than the call return value. Long running precompiles deliver through
          a callback from the AsyncDelivery proxy. Guard callbacks with a check that the sender is the delivery proxy.
        </p>
      </Card>
    </Container>
  );
}
