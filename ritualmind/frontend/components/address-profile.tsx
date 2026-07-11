"use client";

import {ArrowUpRight, Boxes, FileCode2, User, Wallet} from "lucide-react";
import {useAddressOverview, useWalletReputation, isReputationConfigured} from "@/lib/hooks";
import {MonoAddress} from "@/components/ui/mono";
import {Card, SectionLabel, Skeleton, Tag} from "@/components/ui/primitives";
import {Unavailable} from "@/components/unavailable";
import {explorerAddress} from "@/lib/chain";

function Metric({label, value, sub}: {label: string; value: string; sub?: string}) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-soft">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-dim">{label}</div>
      <div className="mt-2 font-mono text-lg font-bold tabular text-ink">{value}</div>
      {sub !== undefined ? <div className="mt-1 text-xs text-ink-dim">{sub}</div> : null}
    </div>
  );
}

function ReputationSection({address}: {address: string}) {
  const configured = isReputationConfigured();
  const {data, isLoading} = useWalletReputation(address);

  if (!configured) {
    return (
      <Unavailable title="Reputation scoring is not live yet">
        The Ritual Mind contracts are not deployed, so this address has no on chain reputation to show. Nothing here is
        estimated. Once the contracts are deployed and configured, a verifiable composite score and its evidence appear
        here automatically.
      </Unavailable>
    );
  }
  if (isLoading || data === undefined || data === null) {
    return <Skeleton className="h-40 w-full" />;
  }
  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionLabel>Reputation</SectionLabel>
        <a href={data.evidence.explorer} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono text-[11px] text-good hover:underline">
          verified on chain <ArrowUpRight size={12} />
        </a>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Composite" value={String(data.composite)} sub="out of 1000" />
        <Metric label="Builder" value={String(data.builder)} sub="out of 400" />
        <Metric label="Advocate" value={String(data.advocate)} sub="out of 300" />
        <Metric label="Community" value={String(data.community)} sub="out of 200" />
      </div>
    </Card>
  );
}

export function AddressProfile({address}: {address: string}) {
  const {data, isLoading, isError} = useAddressOverview(address);

  const accountType = (): {label: string; icon: typeof User; tone: "brand" | "info" | "neutral"} => {
    if (data === undefined) return {label: "Account", icon: User, tone: "neutral"};
    if (data.contractName !== null) return {label: data.contractName, icon: Boxes, tone: "brand"};
    if (data.isContract) return {label: "Contract", icon: FileCode2, tone: "info"};
    return {label: "Externally owned account", icon: Wallet, tone: "neutral"};
  };
  const account = accountType();
  const AccountIcon = account.icon;

  const noActivity = data !== undefined && !data.isContract && data.outgoingTxCount === 0 && data.balanceWei === 0n;

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-black/[0.06] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[0.06] bg-white text-brand shadow-soft">
            <AccountIcon size={20} strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-ink">Address</h1>
              {data !== undefined ? <Tag tone={account.tone}>{account.label}</Tag> : null}
            </div>
            <div className="mt-1">
              <MonoAddress address={address} lead={12} tail={10} />
            </div>
          </div>
        </div>
        <a
          href={explorerAddress(address)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sm text-brand hover:underline"
        >
          View on explorer <ArrowUpRight size={14} />
        </a>
      </div>

      {isError ? (
        <div className="mt-8">
          <Unavailable title="This address could not be read">
            The Ritual RPC did not return data for this address. It may be a transient error. Try again shortly.
          </Unavailable>
        </div>
      ) : isLoading || data === undefined ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({length: 4}).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div>
            <div className="mb-3">
              <SectionLabel>On chain, from the Ritual RPC</SectionLabel>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                label="Balance"
                value={Number(data.balanceRitual).toLocaleString("en-US", {maximumFractionDigits: 4})}
                sub="RITUAL"
              />
              <Metric label="Outgoing txns" value={data.outgoingTxCount.toLocaleString("en-US")} sub="nonce" />
              <Metric label="Account type" value={data.isContract ? "Contract" : "EOA"} />
              <Metric
                label="Code size"
                value={data.isContract ? data.codeSizeBytes.toLocaleString("en-US") : "0"}
                sub="bytes"
              />
            </div>
            {noActivity ? (
              <p className="mt-4 text-sm text-ink-muted">
                No on chain activity found for this address. It holds no balance and has sent no transactions.
              </p>
            ) : (
              <p className="mt-4 text-xs text-ink-dim">
                These values are read live from the Ritual RPC and can be verified on the explorer. Full transaction
                history is available on the explorer, which indexes the chain.
              </p>
            )}
          </div>

          <div>
            <ReputationSection address={address} />
          </div>
        </div>
      )}
    </div>
  );
}
