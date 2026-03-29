/**
 * `beastmode <phase> <args...>`
 *
 * Orchestrates: worktree creation -> phase execution -> run logging.
 *
 * - Design phase: spawns interactive claude CLI (Bun.spawn, inherited stdio)
 * - Implement phase: fan-out — per-feature worktrees + parallel SDK sessions
 * - All other phases: uses Claude Agent SDK with streaming output
 * - All phases: logs run metadata to .beastmode-runs.json on completion
 */

import type { BeastmodeConfig } from "../config";
import type { Phase, PhaseResult } from "../types";
import { VALID_PHASES } from "../types";
import { runPhaseWithSdk } from "../runners/sdk-runner";
import { runDesignInteractive } from "../runners/design-runner";
import { appendRunLog } from "../utils/run-log";
import {
  ensureWorktree,
  enter as enterWorktree,
  archive as archiveWorktree,
  merge as mergeWorktree,
  remove as removeWorktree,
} from "../worktree";
import {
  findManifestPath,
  readManifest,
  getPendingFeatures,
} from "../manifest";

/** Result of a fan-out implement run (per-feature results). */
export interface FanOutResult {
  epicSlug: string;
  featureResults: Array<{
    featureSlug: string;
    result: PhaseResult;
  }>;
}

/**
 * Execute a phase command. Called directly from the top-level router.
 * Phase is already validated by the argument parser.
 */
export async function phaseCommand(
  phase: Phase,
  args: string[],
  _config: BeastmodeConfig,
): Promise<void> {
  const projectRoot = process.cwd();

  if (phase === "implement") {
    await runImplementFanOut(args, projectRoot);
    return;
  }

  // Non-implement phases: single epic worktree
  const worktreeSlug = deriveWorktreeSlug(phase, args);

  await ensureWorktree(worktreeSlug);
  const cwd = enterWorktree(worktreeSlug);

  console.log(`[beastmode] Phase: ${phase}`);
  console.log(`[beastmode] Worktree: ${cwd}`);
  console.log("");

  let result: PhaseResult;

  if (phase === "design") {
    const topic = args.join(" ");
    if (!topic) {
      console.error(`Usage: beastmode design <topic>`);
      console.error(`Phases: ${VALID_PHASES.join(", ")}`);
      process.exit(1);
    }
    result = await runDesignInteractive({ topic, cwd });
  } else {
    result = await runPhaseWithSdk({ phase, args, cwd });
  }

  await appendRunLog(projectRoot, phase, args, result);

  console.log("");
  console.log(
    `[beastmode] ${phase} ${result.exit_status} in ${formatDuration(result.duration_ms)}`,
  );

  // Release teardown: archive, merge, remove worktree on success
  if (phase === "release" && result.exit_status === "success") {
    try {
      console.log("[beastmode] Release successful — starting teardown...");

      const tagName = await archiveWorktree(worktreeSlug, { cwd: projectRoot });
      console.log(`[beastmode] Archived branch tip: ${tagName}`);

      await mergeWorktree(worktreeSlug, { cwd: projectRoot });
      console.log("[beastmode] Squash-merged to main");

      await removeWorktree(worktreeSlug, { cwd: projectRoot });
      console.log("[beastmode] Worktree removed");

      console.log("[beastmode] Release teardown complete");
    } catch (err) {
      console.error("[beastmode] Release teardown failed:", err);
      console.error("[beastmode] Worktree preserved for manual cleanup");
    }
  }

  if (result.exit_status === "error") {
    process.exit(1);
  }
  if (result.exit_status === "cancelled") {
    process.exit(130);
  }
}

/**
 * Implement fan-out: create per-feature worktrees, dispatch parallel SDK
 * sessions, merge results back to epic branch, clean up.
 */
async function runImplementFanOut(
  args: string[],
  projectRoot: string,
): Promise<void> {
  const epicSlug = args[0];
  if (!epicSlug) {
    console.error("Usage: beastmode implement <epic-slug>");
    process.exit(1);
  }

  // Create epic worktree (holds the manifest and is the merge target)
  await createWorktree(epicSlug);
  const epicCwd = enterWorktree(epicSlug);

  // Read manifest from the epic worktree
  const manifestPath = findManifestPath(epicCwd, epicSlug);
  if (!manifestPath) {
    console.error(`[beastmode] No manifest found for epic: ${epicSlug}`);
    console.error(
      `[beastmode] Expected: .beastmode/state/plan/*-${epicSlug}.manifest.json`,
    );
    process.exit(1);
  }

  const manifest = readManifest(manifestPath);
  const pendingFeatures = getPendingFeatures(manifest);

  if (pendingFeatures.length === 0) {
    console.log("[beastmode] All features already completed.");
    return;
  }

  console.log(`[beastmode] Implement fan-out: ${epicSlug}`);
  console.log(
    `[beastmode] Features: ${pendingFeatures.map((f) => f.slug).join(", ")}`,
  );
  console.log("");

  // Create per-feature worktrees and dispatch parallel SDK sessions
  const dispatches: Array<{
    featureSlug: string;
    worktreeSlug: string;
    cwd: string;
    promise: Promise<PhaseResult>;
  }> = [];

  for (const feature of pendingFeatures) {
    const worktreeSlug = `${epicSlug}-${feature.slug}`;

    await createWorktree(worktreeSlug);
    const featureCwd = enterWorktree(worktreeSlug);

    console.log(
      `[beastmode] Dispatching: ${feature.slug} -> ${worktreeSlug}`,
    );

    const promise = runPhaseWithSdk({
      phase: "implement",
      args: [epicSlug, feature.slug],
      cwd: featureCwd,
    });

    dispatches.push({
      featureSlug: feature.slug,
      worktreeSlug,
      cwd: featureCwd,
      promise,
    });
  }

  // Wait for all sessions to complete
  console.log(
    `\n[beastmode] Waiting for ${dispatches.length} feature session(s)...\n`,
  );

  const results = await Promise.allSettled(
    dispatches.map(async (d) => ({
      ...d,
      result: await d.promise,
    })),
  );

  // Collect results
  const featureResults: FanOutResult["featureResults"] = [];
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const settled of results) {
    if (settled.status === "fulfilled") {
      const { featureSlug, worktreeSlug, result } = settled.value;
      featureResults.push({ featureSlug, worktreeSlug, result });

      if (result.exit_status === "success") {
        succeeded.push(worktreeSlug);
      } else {
        failed.push(worktreeSlug);
      }

      // Log each feature run
      await appendRunLog(projectRoot, "implement", [epicSlug, featureSlug], result);
    } else {
      // Session threw — shouldn't normally happen
      console.error("[beastmode] Feature session error:", settled.reason);
    }
  }

  // Report
  console.log("");
  console.log("[beastmode] Fan-out results:");
  for (const fr of featureResults) {
    const icon = fr.result.exit_status === "success" ? "ok" : "FAIL";
    console.log(
      `  [${icon}] ${fr.featureSlug} (${formatDuration(fr.result.duration_ms)})`,
    );
  }

  // Merge successful feature branches back to epic branch
  if (succeeded.length > 0) {
    console.log("");
    console.log("[beastmode] Merging feature branches to epic branch...");

    const epicBranch = `feature/${epicSlug}`;
    const featureBranches = succeeded.map((s) => `feature/${s}`);

    try {
      const mergeReport = await coordinateMerges(featureBranches, {
        cwd: projectRoot,
        targetBranch: epicBranch,
      });

      console.log(
        `[beastmode] Merge: ${mergeReport.succeeded} succeeded, ${mergeReport.conflictResolved} conflict-resolved, ${mergeReport.failed} failed`,
      );

      // Remove worktrees for successfully merged features
      for (const mergeResult of mergeReport.results) {
        if (mergeResult.status === "success" || mergeResult.status === "conflict-resolved") {
          const slug = mergeResult.branch.replace("feature/", "");
          try {
            await removeWorktree(slug, { cwd: projectRoot });
            console.log(`[beastmode] Removed worktree: ${slug}`);
          } catch (err) {
            console.warn(`[beastmode] Warning: failed to remove worktree ${slug}:`, err);
          }
        }
      }

      // Report failed merges — worktrees preserved for retry
      for (const mergeResult of mergeReport.results) {
        if (mergeResult.status === "failed") {
          const slug = mergeResult.branch.replace("feature/", "");
          console.warn(
            `[beastmode] Worktree preserved for retry: ${slug} (${mergeResult.error})`,
          );
        }
      }
    } catch (err) {
      console.error("[beastmode] Merge coordination failed:", err);
    }
  }

  // Preserve failed feature worktrees for retry
  if (failed.length > 0) {
    console.log("");
    console.log("[beastmode] Failed features (worktrees preserved for retry):");
    for (const slug of failed) {
      console.log(`  - ${slug}`);
    }
  }

  // Overall status
  const allSuccess = failed.length === 0;
  console.log("");
  console.log(
    `[beastmode] implement ${allSuccess ? "success" : "partial"} — ${succeeded.length}/${dispatches.length} features completed`,
  );

  if (!allSuccess) {
    process.exit(1);
  }
}

function deriveWorktreeSlug(phase: Phase, args: string[]): string {
  if (phase === "design") {
    const topic = args.join(" ");
    return slugify(topic || "untitled");
  }
  // All non-design, non-implement phases share the epic worktree
  return args[0] || "default";
}

/** Slugification matching worktree-manager.md derivation logic. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
