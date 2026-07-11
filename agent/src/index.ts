import {loadConfig} from "./config.js";
import {createClients} from "./chain/client.js";
import {runCycle, type CycleState} from "./cycle.js";
import {currentDayIndex, msUntilNextCycle} from "./scheduler.js";
import {log} from "./logger.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const clients = createClients(config);
  const runOnce = process.argv.includes("--once");

  // Start one day back so the first cycle of a new UTC day posts a digest.
  const state: CycleState = {lastDigestDayIndex: currentDayIndex() - 1};

  log.info("Ritual Mind agent starting", {
    agent: clients.account.address,
    chainId: 1979,
    mode: runOnce ? "single cycle" : "continuous",
    intervalMs: config.cycle.intervalMs,
  });

  if (runOnce) {
    await runCycle(config, clients, state);
    return;
  }

  for (;;) {
    const startedAt = Date.now();
    try {
      await runCycle(config, clients, state);
    } catch (error) {
      log.error("cycle threw", {error: error instanceof Error ? error.message : String(error)});
    }
    const waitMs = msUntilNextCycle(config.cycle.intervalMs, startedAt);
    log.info("sleeping until next cycle", {waitMs});
    await sleep(waitMs);
  }
}

main().catch((error: unknown) => {
  log.error("fatal error", {error: error instanceof Error ? error.message : String(error)});
  process.exitCode = 1;
});
