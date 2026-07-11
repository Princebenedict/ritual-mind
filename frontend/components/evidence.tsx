import {ArrowUpRight} from "lucide-react";
import {explorerAddress, explorerBlock, explorerTx} from "@/lib/chain";
import {shortHash} from "@/lib/rpc";
import {shortAddress, formatDateUtc} from "@/lib/utils";
import type {Evidence} from "@/lib/types";

/**
 * Renders the verifiable provenance of an on chain value: the contract it was read from and,
 * when available, the transaction that wrote it, the block, the time, and the TEE attestation
 * hash. Every reference is a clickable link to the official Ritual explorer. This is how the
 * product proves a score or badge is real rather than asserted.
 */
export function EvidenceBar({evidence, label = "On chain evidence"}: {evidence: Evidence; label?: string}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-black/[0.06] bg-bg-base px-4 py-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-good">{label}</span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-ink-dim">
        <a href={explorerAddress(evidence.contract)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
          contract {shortAddress(evidence.contract)} <ArrowUpRight size={11} />
        </a>
        {evidence.txHash !== undefined ? (
          <a href={explorerTx(evidence.txHash)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
            tx {shortHash(evidence.txHash)} <ArrowUpRight size={11} />
          </a>
        ) : null}
        {evidence.blockNumber !== undefined ? (
          <a href={explorerBlock(evidence.blockNumber)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-brand">
            block {evidence.blockNumber.toLocaleString("en-US")} <ArrowUpRight size={11} />
          </a>
        ) : null}
        {evidence.timestamp !== undefined ? <span>written {formatDateUtc(evidence.timestamp)}</span> : null}
        {evidence.attestationHash !== undefined &&
        evidence.attestationHash !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
          <span title={evidence.attestationHash}>attestation {shortHash(evidence.attestationHash)}</span>
        ) : null}
      </div>
    </div>
  );
}
