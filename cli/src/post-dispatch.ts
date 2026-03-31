/**
 * Post-dispatch hook — thin event router that feeds phase outcomes to the
 * epic state machine and syncs the result to disk + GitHub.
 *
 * The machine owns all manifest mutations (enrichment, advancement,
 * regression, feature tracking). This module is responsible only for:
 *   1. Loading phase output from the worktree
 *   2. Loading the manifest from disk
 *   3. Mapping phase + output → machine event
 *   4. Sending that event to a hydrated epic actor
 *   5. Persisting the resulting state back to disk
 *   6. Syncing to GitHub (warn-and-continue)
 *
 * Never throws — all errors are caught and logged with a [post-dispatch] prefix.
 */

import type { Phase } from "./types";
import type { PipelineManifest } from "./manifest-store";
import type { Logger } from "./logger";
import type { EpicContext, EpicEvent } from "./pipeline-machine";
import * as store from "./manifest-store";
import { loadWorktreePhaseOutput, loadWorktreeFeatureOutput } from "./phase-output";
import { syncGitHub } from "./github-sync";
import { setGitHubEpic, setFeatureGitHubIssue, setEpicBodyHash, setFeatureBodyHash } from "./manifest";
import { discoverGitHub } from "./github-discovery";
import { loadConfig } from "./config";
import { createLogger } from "./logger";
import { createEpicActor, epicMachine } from "./pipeline-machine";
import { createActor } from "xstate";
import { execSync } from "child_process";

/** Options for the post-dispatch hook. */
export interface PostDispatchOptions {
  /** Path to the worktree where the phase ran */
  worktreePath: string;
  /** Project root (where pipeline/ lives) */
  projectRoot: string;
  /** Epic slug */
  epicSlug: string;
  /** Phase that was dispatched */
  phase: Phase;
  /** Feature slug (for implement fan-out) */
  featureSlug?: string;
  /** Whether the phase succeeded */
  success: boolean;
  /** Optional logger — defaults to createLogger(0, "post-dispatch") */
  logger?: Logger;
}

/**
 * Run post-dispatch processing: read phase output, map to machine event,
 * send to epic actor, persist, and sync to GitHub.
 *
 * Never throws. All errors are caught and logged as warnings so a sync
 * failure never blocks the pipeline.
 */
export async function runPostDispatch(opts: PostDispatchOptions): Promise<void> {
  const logger = opts.logger ?? createLogger(0, "post-dispatch");
  try {
    // Early exit on failure — no manifest/sync updates
    if (!opts.success) {
      logger.log(`Phase ${opts.phase} failed for ${opts.epicSlug} — skipping updates`);
      return;
    }

    // Resolve the output slug — for design phase the epicSlug is a temp hex,
    // so we extract the real slug from the checkpoint commit message.
    // All other phases use the epicSlug directly.
    const outputSlug = opts.phase === "design"
      ? resolveDesignSlug(opts.worktreePath, logger) ?? undefined
      : opts.epicSlug;

    // Load phase output from the worktree artifacts dir, filtered by slug
    const output = loadWorktreePhaseOutput(opts.worktreePath, opts.phase, outputSlug);
    if (output) {
      logger.detail(`Loaded phase output for ${opts.phase}/${outputSlug ?? opts.epicSlug} (status: ${output.status})`);
    } else {
      logger.detail(`No phase output found for ${opts.phase}/${outputSlug ?? opts.epicSlug} — continuing without enrichment`);
    }

    // Load the manifest
    const manifest = store.load(opts.projectRoot, opts.epicSlug);
    if (!manifest) {
      logger.debug(`No manifest found for ${opts.epicSlug} — cannot update`);
      return;
    }
    logger.detail(`Loaded manifest for ${opts.epicSlug} (phase: ${manifest.phase})`);

    // Build the epic actor hydrated at the manifest's current phase.
    // The persist action captures `actor` by reference (assigned before any
    // event is sent, so the closure is safe for synchronous action execution).
    let actor: ReturnType<typeof createEpicActor>;
    const persistAction = ({ context }: { context: EpicContext }) => {
      const snapshot = actor.getSnapshot();
      const phase = (typeof snapshot.value === "string" ? snapshot.value : context.phase) as Phase;
      store.save(opts.projectRoot, opts.epicSlug, {
        ...context,
        phase,
      } as unknown as PipelineManifest);
    };

    // Hydrate actor at the correct state by resolving a snapshot
    const epicContext = manifest as unknown as EpicContext;
    const resolvedSnapshot = epicMachine.resolveState({
      value: manifest.phase,
      context: epicContext,
    });
    const machine = epicMachine.provide({ actions: { persist: persistAction } });
    actor = createActor(machine, { snapshot: resolvedSnapshot, input: epicContext });
    actor.start();

    // Map phase + output → machine events and send them
    const events = mapToEvents(opts, output, manifest, logger);
    for (const event of events) {
      logger.log(`Event: ${event.type}`);
      actor.send(event);
    }

    // Final persist — read the actor's settled state and write to disk.
    // This covers cases where the machine processed events but no transition
    // fired persist (e.g., guard rejected the event).
    const finalSnapshot = actor.getSnapshot();
    const finalPhase = (typeof finalSnapshot.value === "string"
      ? finalSnapshot.value
      : manifest.phase) as Phase;
    store.save(opts.projectRoot, opts.epicSlug, {
      ...(finalSnapshot.context as unknown as PipelineManifest),
      phase: finalPhase,
    } as PipelineManifest);

    actor.stop();

    // Sync to GitHub — warn-and-continue
    try {
      const config = loadConfig(opts.projectRoot);
      if (config.github.enabled) {
        const resolved = await discoverGitHub(opts.projectRoot, config.github["project-name"]);
        if (resolved) {
          const updatedManifest = store.load(opts.projectRoot, opts.epicSlug);
          if (updatedManifest) {
            const syncResult = await syncGitHub(updatedManifest, config, resolved);

            // Apply sync mutations (issue numbers, body hashes) back to manifest
            if (syncResult.mutations.length > 0) {
              let mutated = updatedManifest;
              for (const m of syncResult.mutations) {
                switch (m.type) {
                  case "setEpic":
                    mutated = setGitHubEpic(mutated, m.epicNumber, m.repo);
                    break;
                  case "setFeatureIssue":
                    mutated = setFeatureGitHubIssue(mutated, m.featureSlug, m.issueNumber);
                    break;
                  case "setEpicBodyHash":
                    mutated = setEpicBodyHash(mutated, m.bodyHash);
                    break;
                  case "setFeatureBodyHash":
                    mutated = setFeatureBodyHash(mutated, m.featureSlug, m.bodyHash);
                    break;
                }
              }
              store.save(opts.projectRoot, opts.epicSlug, mutated);
            }

            logger.log("GitHub sync complete");
          }
        } else {
          logger.detail("GitHub discovery failed — skipping sync");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`GitHub sync failed (non-blocking): ${message}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Unexpected error (non-blocking): ${message}`);
  }
}

// ── Design slug resolution ──────────────────────────────────────

/**
 * Extract the real epic slug from the worktree's latest commit message.
 * The design checkpoint always commits as `design(<slug>): checkpoint`.
 * Returns null if the commit message doesn't match.
 */
function resolveDesignSlug(worktreePath: string, logger: Logger): string | null {
  try {
    const msg = execSync("git log -1 --format=%s", {
      cwd: worktreePath,
      encoding: "utf-8",
    }).trim();
    const match = msg.match(/^design\((.+?)\):/);
    if (match) {
      logger.detail(`Resolved design slug from commit: ${match[1]}`);
      return match[1];
    }
    logger.detail(`Could not extract slug from commit message: ${msg}`);
    return null;
  } catch {
    return null;
  }
}

// ── Event mapping ────────────────────────────────────────────────

/**
 * Map post-dispatch options + phase output to a sequence of machine events.
 * Returns an ordered list — some phases may produce multiple events
 * (e.g., FEATURE_COMPLETED followed by IMPLEMENT_COMPLETED).
 */
function mapToEvents(
  opts: PostDispatchOptions,
  output: ReturnType<typeof loadWorktreePhaseOutput>,
  _manifest: PipelineManifest,
  logger: Logger,
): EpicEvent[] {
  const events: EpicEvent[] = [];

  switch (opts.phase) {
    case "design": {
      const artifacts = output?.artifacts as Record<string, unknown> | undefined;
      const realSlug = artifacts?.slug as string | undefined;
      const summary = artifacts?.summary as { problem: string; solution: string } | undefined;
      events.push({ type: "DESIGN_COMPLETED", realSlug, summary });
      break;
    }

    case "plan": {
      const features = extractFeaturesFromOutput(output);
      if (features.length > 0) {
        events.push({ type: "PLAN_COMPLETED", features });
      } else {
        // No features extracted — send anyway, guard will reject if empty
        events.push({ type: "PLAN_COMPLETED", features: [] });
      }
      break;
    }

    case "implement": {
      if (opts.featureSlug) {
        // Fan-out: check if this specific feature's output confirms completion
        const featureOutput = loadWorktreeFeatureOutput(
          opts.worktreePath,
          opts.phase,
          opts.epicSlug,
          opts.featureSlug,
        );
        if (featureOutput?.status === "completed") {
          events.push({ type: "FEATURE_COMPLETED", featureSlug: opts.featureSlug });
          logger.log(`Feature ${opts.featureSlug} completed`);
        } else {
          logger.detail(`Feature ${opts.featureSlug} session exited 0 but no output.json — not marking completed`);
        }
      }
      // Always attempt IMPLEMENT_COMPLETED — the guard checks allFeaturesCompleted
      events.push({ type: "IMPLEMENT_COMPLETED" });
      break;
    }

    case "validate": {
      if (output?.status === "completed") {
        events.push({ type: "VALIDATE_COMPLETED" });
      } else {
        events.push({ type: "VALIDATE_FAILED" });
      }
      break;
    }

    case "release": {
      if (output?.status === "completed") {
        events.push({ type: "RELEASE_COMPLETED" });
      }
      break;
    }
  }

  return events;
}

/**
 * Extract feature definitions from plan phase output.
 * Returns array suitable for PLAN_COMPLETED event payload.
 */
function extractFeaturesFromOutput(
  output: ReturnType<typeof loadWorktreePhaseOutput>,
): Array<{ slug: string; plan: string; description?: string }> {
  if (!output) return [];
  const artifacts = output.artifacts as unknown as Record<string, unknown>;
  if (!artifacts || !Array.isArray(artifacts.features)) return [];

  const features: Array<{ slug: string; plan: string; description?: string }> = [];
  for (const entry of artifacts.features) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as Record<string, unknown>).slug === "string"
    ) {
      const rec = entry as Record<string, unknown>;
      features.push({
        slug: rec.slug as string,
        plan: typeof rec.plan === "string" ? rec.plan : "",
        description: typeof rec.description === "string" ? rec.description : undefined,
      });
    }
  }
  return features;
}
