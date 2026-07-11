/**
 * Structured logger. The agent is a long running service, so it writes structured
 * JSON lines to stderr. There is no bare console.log anywhere in the codebase.
 */
type Level = "info" | "warn" | "error" | "debug";

function emit(level: Level, message: string, meta?: Record<string, unknown>): void {
  const record = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  process.stderr.write(`${JSON.stringify(record)}\n`);
}

export const log = {
  info: (message: string, meta?: Record<string, unknown>): void => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>): void => emit("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>): void => {
    if (process.env.DEBUG === "1" || process.env.DEBUG === "true") {
      emit("debug", message, meta);
    }
  },
};
