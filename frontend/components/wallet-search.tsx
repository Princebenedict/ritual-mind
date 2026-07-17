"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {ArrowRight, Search} from "lucide-react";
import {isValidAddress} from "@/lib/rpc";
import {cn} from "@/lib/utils";

/**
 * Address input. The product does not connect wallets. A user pastes a Ritual address, it
 * is validated, and the profile reads real on chain data for it. Invalid input shows an
 * honest error rather than guessing.
 */
export function WalletSearch({size = "lg"}: {size?: "lg" | "md"}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    const query = value.trim();
    if (isValidAddress(query)) {
      setError(false);
      router.push(`/wallet/${query}`);
    } else {
      setError(true);
    }
  };

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "flex items-center gap-2.5 rounded-2xl border bg-card pl-5 pr-2 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all focus-within:border-brand/40 focus-within:shadow-soft",
          error ? "border-bad/50" : "border-line",
          size === "lg" ? "h-16" : "h-12",
        )}
      >
        <Search size={18} className="text-ink-dim" />
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(false);
          }}
          placeholder="Paste a Ritual address (0x...)"
          aria-label="Ritual address"
          className="h-full flex-1 bg-transparent font-mono text-sm text-ink outline-none placeholder:font-sans placeholder:text-ink-dim"
        />
        <button
          type="submit"
          aria-label="Look up address"
          className="flex h-10 items-center gap-1.5 rounded-xl border border-brand/25 bg-brand/[0.10] px-4 text-sm font-bold text-brand shadow-soft transition-all hover:bg-brand/[0.16] active:scale-[0.98]"
        >
          Look up
          <ArrowRight size={15} />
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-bad">Enter a valid Ritual address. It must be a 42 character 0x value.</p> : null}
    </div>
  );
}
