/**
 * Reconciling factory — wraps the iTerm2 SessionFactory with the unified pipeline
 * runner for post-dispatch processing. This ensures consistent behavior
 * (reconciliation, GitHub sync, release teardown) without duplicating logic
 * that lives in pipeline/runner.ts.
 */

import { loadConfig } from "../config.js";
import type { Logger } from "../logger.js";
import type { SessionFactory, SessionCreateOpts, SessionHandle } from "./factory.js";
import type { Phase } from "../types.js";
import { run as runPipeline } from "../pipeline/runner.js";
import type { ResolvedGitHub } from "../github/discovery.js";

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
