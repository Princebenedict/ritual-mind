"use client";

import {useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {Send, Sparkles, X} from "lucide-react";
import {useUI} from "@/lib/store";
import {useNetworkStatus} from "@/lib/hooks";
import type {NetworkStatus} from "@/lib/rpc";

interface Message {
  role: "user" | "assistant";
  text: string;
}

function answer(query: string, status: NetworkStatus | undefined): string {
  const q = query.toLowerCase();
  if (q.includes("block") || q.includes("network") || q.includes("gas") || q.includes("chain")) {
    if (status === undefined) {
      return "Live network status is loading from the Ritual RPC. Ask again in a moment.";
    }
    return `Live from the Ritual RPC. The latest block is ${status.blockNumber.toLocaleString("en-US")}. Average block time is about ${(status.blockTimeMs / 1000).toFixed(2)} seconds. Gas price is ${(Number(status.gasPriceWei) / 1e9).toFixed(2)} gwei. The chain id is ${status.chainId}.`;
  }
  if (q.includes("address") || q.includes("wallet") || q.includes("balance")) {
    return "Paste a Ritual address in the search to read its real balance, outgoing transaction count, and account type. No wallet connection is required.";
  }
  if (q.includes("reputation") || q.includes("score") || q.includes("badge") || q.includes("rank")) {
    return "Reputation is live on chain. The Ritual Mind contracts are deployed on Ritual Chain, but the registries are empty until the agent completes its first cycle, so there are no scores, badges, or rankings yet, and nothing is estimated. Real scores appear with on chain evidence such as the registry address, the transaction that wrote them, and explorer links.";
  }
  if (q.includes("feed") || q.includes("activity") || q.includes("transaction")) {
    return "The live activity feed shows real transactions from the latest Ritual blocks, decoded into their native types such as async commitments and settlements. Each item links to the official explorer.";
  }
  return "I report live network status from the Ritual RPC and explain what data is available. Chain data such as blocks, transactions, and address balances is live now. Reputation features read from the deployed Ritual Mind contracts and fill in as the agent scans the network and scores wallets.";
}

export function Assistant() {
  const open = useUI((state) => state.assistantOpen);
  const setOpen = useUI((state) => state.setAssistantOpen);
  const {data: status} = useNetworkStatus();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "I can report live Ritual Network status and explain what data is available. Chain data is live, and the Ritual Mind contracts are deployed, so reputation fills in as the agent scans the network and scores wallets.",
    },
  ]);

  const submit = () => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return;
    setMessages((prev) => [...prev, {role: "user", text: trimmed}, {role: "assistant", text: answer(trimmed, status)}]);
    setInput("");
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{x: 380}}
            animate={{x: 0}}
            exit={{x: 380}}
            transition={{duration: 0.28, ease: [0.16, 1, 0.3, 1]}}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-sm flex-col border-l border-line bg-card shadow-soft-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Assistant"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-agent" />
                <span className="text-sm font-bold">Assistant</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="text-ink-dim hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "text-right" : ""}>
                  {message.role === "assistant" ? (
                    <div className="rounded-xl border border-agent/20 bg-agent/[0.06] p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-agent">
                        <span className="inline-block h-1.5 w-1.5 rotate-45 bg-agent" />
                        Live data
                      </div>
                      <p className="text-sm leading-relaxed text-ink-muted">{message.text}</p>
                    </div>
                  ) : (
                    <span className="inline-block rounded-xl bg-ink/[0.05] px-3 py-2 text-sm text-ink">{message.text}</span>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
              className="flex items-center gap-2 border-t border-line p-3"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about the live network"
                className="h-11 flex-1 rounded-xl border border-line bg-card px-4 text-sm outline-none transition-all placeholder:text-ink-dim focus:border-brand/40 focus:shadow-soft"
              />
              <button type="submit" aria-label="Send" className="flex h-11 w-11 items-center justify-center rounded-xl border border-agent/40 bg-agent/[0.08] text-agent transition-all hover:bg-agent/[0.16] active:scale-95">
                <Send size={15} />
              </button>
            </form>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
