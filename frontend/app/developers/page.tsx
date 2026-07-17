import Link from "next/link";
import {ArrowUpRight} from "lucide-react";
import {Container, PageHeader} from "@/components/page";
import {Card, SectionLabel, buttonClass} from "@/components/ui/primitives";
import {CodeBlock} from "@/components/code-block";

/**
 * Official Ritual resources and infrastructure references for builders. These are Ritual
 * Foundation properties, not community projects, so they live here as reference material.
 * Every link is real and verifiable. Edit this list to keep it current.
 */
const RESOURCES: {name: string; url: string; body: string}[] = [
  {
    name: "Ritual Chain",
    url: "https://ritual.net",
    body: "The Layer 1 with AI embedded directly in the chain. EVM++, Symphony consensus, and a native model marketplace, so contracts can call models as first class operations.",
  },
  {
    name: "Infernet",
    url: "https://ritual.net",
    body: "Ritual's decentralized oracle network for AI workloads. Thousands of independent nodes connect off chain compute to on chain smart contracts on any EVM chain.",
  },
  {
    name: "Realm",
    url: "https://ritualfoundation.org",
    body: "The Ritual Foundation's builder program. Technical, educational, and financial support for teams shipping on Ritual Chain. The front door for new ecosystem projects.",
  },
  {
    name: "Ritual Explorer",
    url: "https://explorer.ritualfoundation.org",
    body: "The official block explorer for Ritual Chain (id 1979). Inspect blocks, transactions, and contracts.",
  },
  {
    name: "Ritual Faucet",
    url: "https://faucet.ritualfoundation.org",
    body: "Testnet faucet for RITUAL. Fund a wallet to start deploying and calling precompiles.",
  },
  {
    name: "Ritual Docs",
    url: "https://docs.ritualfoundation.org",
    body: "Developer documentation covering architecture, precompiles, the async lifecycle, and integration guides.",
  },
];

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

      <div className="mt-8">
        <SectionLabel>Official Ritual resources</SectionLabel>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Official Ritual Foundation infrastructure and references. Real links you can verify, kept here for builders.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {RESOURCES.map((resource) => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col rounded-2xl border border-line bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-ink group-hover:text-brand">{resource.name}</span>
                <ArrowUpRight size={14} className="text-ink-dim group-hover:text-brand" />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{resource.body}</p>
              <span className="mt-3 font-mono text-xs text-ink-dim">{resource.url.replace("https://", "")}</span>
            </a>
          ))}
        </div>
      </div>
    </Container>
  );
}
