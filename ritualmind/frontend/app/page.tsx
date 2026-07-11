import Link from "next/link";
import {ArrowUpRight, ShieldCheck, Sparkles, Users} from "lucide-react";
import {Container} from "@/components/page";
import {Reveal} from "@/components/ui/motion";
import {Card, Divider, SectionLabel, buttonClass} from "@/components/ui/primitives";
import {LiveFeed} from "@/components/feed";
import {NetworkStatus} from "@/components/network-status";
import {HeroViz} from "@/components/hero-viz";
import {WalletSearch} from "@/components/wallet-search";
import {EXPLORER_URL} from "@/lib/chain";

const TRUST = [
  {
    icon: ShieldCheck,
    title: "Enforced on chain",
    body: "Score caps, the new wallet multiplier, and the daily growth limit are enforced by the registry contract, not trusted to the agent.",
  },
  {
    icon: Sparkles,
    title: "Attested in an enclave",
    body: "Scores are computed inside a trusted execution environment and written with a TEE attestation hash. Admins cannot move a number by hand.",
  },
  {
    icon: Users,
    title: "Resistant to gaming",
    body: "Mutual attestation rings and Sybil clusters are flagged and frozen. A frozen wallet keeps a permanent on chain record and cannot grow.",
  },
];

const MODEL = [
  {name: "Builder", ceiling: 400, body: "Contract deployments, precompile usage, and genuine external adoption."},
  {name: "Advocate", ceiling: 300, body: "Quality of technical content, evaluated by the enclave. Quality, not volume."},
  {name: "Community", ceiling: 200, body: "Attestations received and given, and verified contributions."},
  {name: "User", ceiling: 100, body: "Distinct dApps used, active weeks, and RITUAL held."},
];

const FEED_LEGEND = [
  {label: "Async commitment", body: "A precompile job (HTTP, LLM, agent) committed for a TEE executor."},
  {label: "Async settlement", body: "An executor returned a result and the job settled on chain."},
  {label: "Scheduled call", body: "A recurring call triggered by the Scheduler system contract."},
  {label: "Contract deployed", body: "A new contract went live on Ritual Chain."},
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <Container className="pt-12 sm:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-[11px] text-ink-muted shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-good" />
              Live on Ritual Network, chain 1979
            </div>
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Reputation, computed in an enclave.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
              Ritual Mind reads data directly from Ritual Network. Paste any address to see its real on chain activity.
              Reputation scoring, computed in a trusted execution environment and attested on chain, goes live once the
              Ritual Mind contracts are deployed.
            </p>
            <div className="mt-7 max-w-xl">
              <WalletSearch />
            </div>
            <p className="mt-3 text-xs text-ink-dim">Paste any Ritual address. No wallet connection required.</p>
          </div>
          <Reveal>
            <HeroViz />
          </Reveal>
        </div>
      </Container>

      {/* Real network status */}
      <Container className="pt-16">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Ritual Network, live from the RPC</SectionLabel>
          <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-ink-muted hover:text-brand">
            Explorer <ArrowUpRight size={13} />
          </a>
        </div>
        <NetworkStatus />
      </Container>

      {/* Real live feed + legend */}
      <Container className="pt-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Reveal>
            <LiveFeed limit={12} />
          </Reveal>
          <Reveal delay={0.05}>
            <Card>
              <SectionLabel>What you are seeing</SectionLabel>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Every item is a real transaction from the latest Ritual blocks, linked to the official explorer. Ritual
                native transaction types are decoded so you can read the network, not just raw hashes.
              </p>
              <ul className="mt-4 space-y-3">
                {FEED_LEGEND.map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <div>
                      <div className="text-sm font-bold text-ink">{item.label}</div>
                      <div className="text-xs leading-relaxed text-ink-muted">{item.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </Container>

      {/* Reputation, honest pending state */}
      <Container className="pt-16">
        <Reveal>
          <div className="rounded-3xl border border-black/[0.06] bg-white p-8 shadow-soft sm:p-10">
            <SectionLabel>Reputation</SectionLabel>
            <h2 className="mt-2 max-w-2xl text-2xl font-bold sm:text-3xl">
              Reputation scoring goes live once the Ritual Mind contracts are deployed.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
              The WalletRegistry, ScoreOracle, and agent are not yet on chain, so there are no scores to show. Nothing
              here is estimated or invented. When the contracts are deployed and their addresses are configured, real
              scores flow in with no further change. The model that will be computed is below.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MODEL.map((component) => (
                <div key={component.name} className="rounded-2xl border border-black/[0.06] bg-bg-base p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-bold text-ink">{component.name}</span>
                    <span className="font-mono text-xs text-ink-dim">/ {component.ceiling}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">{component.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>

      {/* Trust */}
      <Container className="pt-16">
        <Divider />
        <div className="grid gap-6 py-12 lg:grid-cols-3">
          {TRUST.map((item) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title}>
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-brand shadow-soft">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>

      {/* CTA */}
      <Container className="pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-black/[0.06] bg-gradient-to-br from-white to-[#FBFAF8] p-8 shadow-soft sm:p-12">
          <div className="relative max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">Bring reputation into your app.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Read scores, badges, and verified builder status with a typed SDK once the contracts are live. Every value
              is backed by an on chain attestation, so your users can verify it themselves.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/sdk" className={buttonClass("brand")}>
                Read the SDK
              </Link>
              <Link href="/developers" className={buttonClass("ghost")}>
                Developer guide
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
