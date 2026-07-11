import {isAddress} from "viem";
import {Container} from "@/components/page";
import {Unavailable} from "@/components/unavailable";
import {AddressProfile} from "@/components/address-profile";

export default async function WalletPage({params}: {params: Promise<{address: string}>}) {
  const {address} = await params;

  if (!isAddress(address)) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg">
          <Unavailable title="Not a valid address">
            The value in the URL is not a well formed Ritual address. A valid address is a 42 character 0x value. Paste a
            correct address from the search to inspect it.
          </Unavailable>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8" wide>
      <AddressProfile address={address} />
    </Container>
  );
}
