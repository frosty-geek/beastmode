import { formatLogLine } from "./shared/log-format";
import type { LogContext, LogLevel } from "./shared/log-format";

export type { LogContext, LogLevel } from "./shared/log-format";

/** Logger instance returned by createLogger. */
export interface Logger {
  /** Level 0 — always shown. Writes to stdout. */
  log(msg: string): void;
  /** Level 1 — shown at -v. Writes to stdout. */
  detail(msg: string): void;
  /** Level 2 — shown at -vv. Writes to stdout. */
  debug(msg: string): void;
  /** Level 3 — shown at -vvv. Writes to stdout. */
  trace(msg: string): void;
  /** Always shown — writes to stderr. */
  warn(msg: string): void;
  /** Always shown — writes to stderr. */
  error(msg: string): void;
  /** Create a child logger with merged context. */
  child(ctx: Partial<LogContext>): Logger;
}

/**
 * Create a scoped logger with verbosity gating.
 *
 * Messages at or below the verbosity level are shown.
 * warn() and error() always show regardless of verbosity.
 *
 * Output uses the shared structured format:
 * `[HH:MM:SS] LEVEL  (scope):  message`
 */
export function createLogger(verbosity: number, context?: LogContext): Logger {
  const ctx = context ?? {};

  function emit(stream: NodeJS.WriteStream, level: LogLevel, msg: string): void {
    stream.write(formatLogLine(level, ctx, msg) + "\n");
  }

  return {
    log(msg: string) {
      if (verbosity >= 0) emit(process.stdout, "info", msg);
    },
    detail(msg: string) {
      if (verbosity >= 1) emit(process.stdout, "detail", msg);
    },
    debug(msg: string) {
      if (verbosity >= 2) emit(process.stdout, "debug", msg);
    },
    trace(msg: string) {
      if (verbosity >= 3) emit(process.stdout, "trace", msg);
    },
    warn(msg: string) {
      emit(process.stderr, "warn", msg);
    },
    error(msg: string) {
      emit(process.stderr, "error", msg);
    },
    child(childCtx: Partial<LogContext>): Logger {
      return createLogger(verbosity, { ...ctx, ...childCtx });
    },
  };
}

/** Create a no-op logger that suppresses all output. Useful for tests. */
export function createNullLogger(): Logger {
  const noop = () => {};
  const nl: Logger = { log: noop, detail: noop, debug: noop, trace: noop, warn: noop, error: noop, child: () => nl };
  return nl;
}
