/**
 * Watch command handler — entry point for `beastmode watch`.
 *
 * Wires the watch loop to the reconcile module, iTerm2 dispatcher,
 * and run logger.
 */

import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { loadConfig } from "../config.js";
import { createLogger } from "../logger.js";
import type { Logger } from "../logger.js";
import { WatchLoop, attachLoggerSubscriber } from "./watch-loop.js";
import type { WatchDeps } from "./watch-loop.js";
import type { SessionFactory, SessionCreateOpts, SessionHandle } from "../dispatch/factory.js";
import { ITermSessionFactory } from "../dispatch/it2.js";
import { It2Client } from "../dispatch/it2.js";
import { listEnriched } from "../manifest/store.js";
import type { Phase } from "../types.js";
import { run as runPipeline } from "../pipeline/runner.js";
import { discoverGitHub } from "../github/discovery.js";
import type { ResolvedGitHub } from "../github/discovery.js";

/** Discover the project root (walks up to find .beastmode/). */
function findProjectRoot(from: string = process.cwd()): string {
  let dir = from;
  while (dir !== "/") {
    if (existsSync(resolve(dir, ".beastmode"))) return dir;
    dir = resolve(dir, "..");
  }
  throw new Error("Not inside a beastmode project (no .beastmode/ found)");
}

/**
 * Reconciling factory — wraps the iTerm2 SessionFactory with the unified pipeline
 * runner for post-dispatch processing. This ensures consistent behavior
 * (reconciliation, GitHub sync, release teardown) without duplicating logic
 * that lives in pipeline/runner.ts.
 */
export class ReconcilingFactory implements SessionFactory {
  private inner: SessionFactory;
  private projectRoot: string;
  private logger: Logger;
  /** Pre-discovered GitHub metadata — set once per scan cycle. */
  resolved?: ResolvedGitHub;

  constructor(inner: SessionFactory, projectRoot: string, logger: Logger) {
    this.inner = inner;
    this.projectRoot = projectRoot;
    this.logger = logger;
  }

  async create(opts: SessionCreateOpts): Promise<SessionHandle> {
    const handle = await this.inner.create(opts);
    const { projectRoot, logger } = this;

    const wrappedPromise = handle.promise.then(async (sessionResult) => {
      const config = loadConfig(projectRoot);
      const scopedLogger = logger.child({
        phase: opts.phase,
        epic: opts.epicSlug,
        ...(opts.featureSlug ? { feature: opts.featureSlug } : {}),
      });

      // Delegate all post-dispatch work (steps 5-9) to the pipeline runner.
      // skipPreDispatch: true  -> skip worktree/rebase/settings (already done)
      // dispatch returns the pre-computed session result immediately.
      const pipelineResult = await runPipeline({
        phase: opts.phase as Phase,
        epicSlug: opts.epicSlug,
        args: opts.args,
        projectRoot,
        strategy: "iterm2",
        featureSlug: opts.featureSlug,
        config,
        logger: scopedLogger,
        resolved: this.resolved,
        skipPreDispatch: true,
        dispatch: async () => ({ success: sessionResult.success }),
      });

      // Release cleanup: close iTerm2 surfaces on success, badge on failure
      if (opts.phase === "release") {
        if (pipelineResult.success) {
          try {
            await this.inner.cleanup?.(opts.epicSlug);
          } catch {
            // Best-effort — surface cleanup should not block the result
          }
        } else {
          try {
            await this.inner.setBadgeOnContainer?.(opts.epicSlug, "ERROR: release failed");
          } catch {
            // Best-effort — badge failure is non-blocking
          }
        }
      }

      return {
        ...sessionResult,
        progress: pipelineResult.reconcileResult?.progress,
      };
    });

    return { ...handle, promise: wrappedPromise };
  }

  async cleanup(epicSlug: string): Promise<void> {
    return this.inner.cleanup?.(epicSlug);
  }
}

/** Parse watch-specific arguments. */
export function parseWatchArgs(args: string[]): { plain: boolean; remaining: string[] } {
  const plain = args.includes("--plain");
  const remaining = args.filter((a) => a !== "--plain");
  return { plain, remaining };
}

/** Main entry point for `beastmode watch`. */
export async function watchCommand(args: string[], verbosity: number = 0): Promise<void> {
  const { plain } = parseWatchArgs(args);
  const useTree = !plain && !!process.stdout.isTTY;

  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);
  const logger = createLogger(verbosity, {});

  const innerFactory: SessionFactory = new ITermSessionFactory(new It2Client());

  const sessionFactory = new ReconcilingFactory(innerFactory, projectRoot, logger);

  if (config.github.enabled) {
    try {
      const resolved = await discoverGitHub(projectRoot, config.github["project-name"], logger);
      sessionFactory.resolved = resolved;
      if (resolved) {
        logger.log(`GitHub discovery: ${resolved.repo} (project #${resolved.projectNumber ?? "none"})`);
      }
    } catch (err) {
      logger.warn(`GitHub discovery failed (non-blocking): ${err}`);
    }
  }

  const deps: WatchDeps = {
    scanEpics: async (root: string) => listEnriched(root),
    sessionFactory,
    logger,
  };

  if (useTree) {
    // Tree mode: Ink handles signals, no alternate screen (full scrollback)
    const loop = new WatchLoop(
      {
        intervalSeconds: config.cli.interval ?? 60,
        projectRoot,
        installSignalHandlers: false,
      },
      deps,
    );

    const { render } = await import("ink");
    const React = await import("react");
    const { default: WatchTreeApp } = await import("./WatchTreeApp.js");

    const { waitUntilExit } = render(
      React.createElement(WatchTreeApp, { loop, verbosity }),
    );

    try {
      await loop.start();
    } catch (err) {
      logger.error(`${err}`);
    }

    try {
      await waitUntilExit();
    } finally {
      if (loop.isRunning()) {
        await loop.stop();
      }
    }
  } else {
    // Flat mode: existing behavior
    const loop = new WatchLoop(
      {
        intervalSeconds: config.cli.interval ?? 60,
        projectRoot,
      },
      deps,
    );

    attachLoggerSubscriber(loop, logger);
    await loop.start();
  }
}
