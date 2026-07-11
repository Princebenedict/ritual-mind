# Ritual Mind, product strategy

## 1. Positioning

Ritual Mind is the reputation and intelligence layer for Ritual Chain. It turns every wallet into a scored identity that is recomputed on a fixed cycle inside a Trusted Execution Environment. Scores are attested by the enclave and written on chain, so no operator, including the team that runs the agent, can move a number by hand. The product is the place people go to answer three questions. Who is real and contributing. What is being built and whether it is growing. What the ecosystem is talking about right now.

The product has to read as infrastructure, not as a leaderboard toy. The trust model is the feature. Every score line, every badge, and every digest carries a link back to the attestation that produced it.

## 2. Primary users and jobs

There are four audiences. Each has a clear job that the interface serves.

Builders want credit for real work. A builder deploys contracts, uses precompiles, ships a project, and earns external usage. The builder score has to reflect genuine adoption, not deployment count. The profile is the builder resume.

Advocates want credit for signal, not noise. An advocate writes technical threads, explains precompiles, and answers questions. The advocate score is driven by quality that a language model evaluates, not by post volume. Spam and bought engagement move the number down, not up.

Founders want to understand their own project and their contributor pipeline. The Founder Studio is gated to verified builders and shows growth curves, active wallets, the contributor funnel, and any wallets that the agent has flagged around the project.

Observers want a live read on the chain. Explorers, researchers, and prospective users watch the live feed, the leaderboard, and the social pulse to gauge momentum before they commit time.

## 3. Information architecture

The application is organized around eleven surfaces. The navigation groups them into four clusters.

Discover cluster.
- Landing. The public entry point. Hero, ecosystem counters, live feed, trending projects, social pulse summary.
- Explorer. A searchable, sortable table of every scored wallet with filters for score bands, badges, and flags.
- Leaderboard. Ranked views across Overall, Builders, Advocates, Community, Users, and Weekly Risers.

Identity cluster.
- Wallet profile at /wallet/[address]. The full scored identity. Composite ring, four sub score rings, rank, thirty day history, score breakdown with per line attestation links, badges, activity log, and the Twitter verification flow.
- Dashboard. The signed in home. Your own profile summary, your projects, watched wallets, and the items that changed since your last visit.

Ecosystem cluster.
- Projects. Grid with category filters, a detail page per project with metrics, top contributors, and an integration snippet, and a registration form.
- Analytics. Ecosystem wide charts. Score distribution, growth, precompile adoption, attestation graph density, and flag rates.
- Social pulse. Sentiment timeline, trending topics, top advocates, best content, and a FUD monitor.
- Intel. The archive of daily digests, each with its TEE attestation hash and source references.

Operate cluster.
- Founder Studio. Verified builder only. Growth, pipeline, flagged wallets, and CSV export.
- Developers and SDK. Integration documentation and a live SDK reference that reads the deployed contracts.
- Settings. Wallet linking, Twitter verification state, notification preferences, and display options within the single dark theme.

Global surfaces present on every page.
- Command palette, opened with the keyboard, for navigation and actions.
- Global search, resolves an address, an ENS style handle, a Twitter handle, or a project name.
- AI assistant, answers questions about a wallet or the ecosystem using on chain data and the latest digest as context.

## 4. Core user flows

Score lookup. A visitor lands, types an address into the hero search, and arrives at the profile. The composite ring animates from zero to the current value. Each sub score expands to show the exact lines that produced it, and each line links to the attestation transaction. Time to first meaningful view is one action.

Twitter verification. A user connects a wallet, opens Settings, and starts the verification flow. The product shows a one time phrase to post. The agent detects the post on its next cycle, confirms ownership, and links the handle. The handle is globally unique. A handle that is already linked to another wallet cannot be claimed.

Project registration. A builder opens the Projects registration form, submits the contract address, name, description, category, and links. The project appears immediately with pending verification. On the next cycle the agent measures active wallets and transactions and updates the metrics. The owner can verify the project once thresholds are met.

Attestation. A wallet vouches for another wallet from the target profile. Self attestation reverts. A repeat attestation of the same target inside the cooldown window reverts. Mutual attestation is recorded on chain and is visible, and the agent penalizes rings during the next cycle.

Founder review. A verified builder opens the Founder Studio, reviews the growth curve and the contributor pipeline, inspects any flagged wallets around the project, and exports the contributor list as CSV.

## 5. Trust and anti gaming as product surface

Anti gaming is not hidden. The leaderboard carries a short, plain note that explains the safeguards. New wallets carry a reduced multiplier for their first seven days. Composite score growth is capped per rolling day. Sybil clusters are flagged and frozen with a permanent on chain record. A flagged wallet shows its flag severity on its profile. The point is legibility. A reader can always see why a number is what it is and can follow the attestation to verify it.

## 6. Success criteria

The build succeeds when a visitor can search any address and read a complete, attested identity in seconds, when a builder can see genuine adoption reflected in the builder score, when a founder can act on the pipeline and flag data, and when every number on every screen can be traced to the enclave attestation that produced it.
