import {Container, PageHeader} from "@/components/page";
import {Unavailable} from "@/components/unavailable";

export default function LeaderboardPage() {
  return (
    <Container className="pb-16">
      <PageHeader
        eyebrow="Ranking"
        title="Leaderboard"
        description="Wallets ranked by their attested on chain reputation."
      />
      <div className="mt-6">
        <Unavailable title="Reputation ranking is not live yet">
          The leaderboard ranks wallets by their composite score from the WalletRegistry contract. That contract is not
          deployed to Ritual Network, so there is no verifiable ranking to show. Nothing here is estimated. This page
          populates automatically once the reputation layer is live on chain.
        </Unavailable>
      </div>
    </Container>
  );
}
