import Link from "next/link";
import {isAddress} from "viem";
import {Container} from "@/components/page";
import {Unavailable} from "@/components/unavailable";

export default async function ProjectPage({params}: {params: Promise<{address: string}>}) {
  const {address} = await params;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg">
        <Unavailable title="Project data is not available">
          Project metrics come from the ProjectRegistry contract, which is not deployed to Ritual Network yet, so there is
          nothing verifiable to show for this contract.
          {isAddress(address) ? (
            <>
              {" "}
              You can still read its real on chain data as an{" "}
              <Link href={`/wallet/${address}`} className="text-brand hover:underline">
                address
              </Link>
              .
            </>
          ) : null}
        </Unavailable>
      </div>
    </Container>
  );
}
