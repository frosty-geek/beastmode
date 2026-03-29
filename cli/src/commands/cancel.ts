/**
 * `beastmode cancel <slug>`
 *
 * Full teardown of an abandoned epic's worktree and associated state.
 *
 * Steps (warn-and-continue for each):
 *   1. Archive branch tip as lightweight tag
 *   2. Remove worktree (force, even with uncommitted changes)
 *   3. Delete local branch (handled by remove)
 *   4. Update manifest phase to "cancelled"
 *   5. Close GitHub epic as not_planned (when enabled)
 *
 * Idempotent — safe to run multiple times.
 */

import type { BeastmodeConfig } from "../config";
import {
  archive as archiveWorktree,
  remove as removeWorktree,
} from "../worktree";
import { findManifestPath } from "../manifest";
import { readFileSync, writeFileSync } from "fs";

export async function cancelCommand(
  args: string[],
  config: BeastmodeConfig,
): Promise<void> {
  const slug = args[0];
  if (!slug) {
    console.error("Usage: beastmode cancel <slug>");
    process.exit(1);
  }

  const projectRoot = process.cwd();

  console.log(`[beastmode] Cancel: ${slug}`);
  console.log("");

  // Step 1: Archive branch tip
  try {
    const tagName = await archiveWorktree(slug, { cwd: projectRoot });
    console.log(`[beastmode] Archived branch tip: ${tagName}`);
  } catch (err) {
    console.warn(
      `[beastmode] Warning: archive failed (branch may not exist): ${err instanceof Error ? err.message : err}`,
    );
  }

  // Step 2+3: Remove worktree and delete branch
  try {
    await removeWorktree(slug, { cwd: projectRoot, deleteBranch: true });
    console.log("[beastmode] Worktree removed, branch deleted");
  } catch (err) {
    console.warn(
      `[beastmode] Warning: worktree removal failed (may already be cleaned up): ${err instanceof Error ? err.message : err}`,
    );
  }

  // Step 4: Update manifest phase to cancelled
  try {
    updateManifestCancelled(projectRoot, slug);
    console.log("[beastmode] Manifest updated: phase = cancelled");
  } catch (err) {
    console.warn(
      `[beastmode] Warning: manifest update failed: ${err instanceof Error ? err.message : err}`,
    );
  }

  // Step 5: Close GitHub epic as not_planned
  if (config.github.enabled) {
    await closeGitHubEpic(projectRoot, slug);
  }

  console.log("");
  console.log(`[beastmode] Cancel complete: ${slug}`);
}

/**
 * Read the manifest for the given slug and set a `phase` field to "cancelled".
 */
function updateManifestCancelled(
  projectRoot: string,
  slug: string,
): void {
  const manifestPath = findManifestPath(projectRoot, slug);
  if (!manifestPath) {
    throw new Error(`No manifest found for: ${slug}`);
  }

  const raw = readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(raw);
  manifest.phase = "cancelled";
  manifest.lastUpdated = new Date().toISOString();
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

/**
 * Close the GitHub epic issue as not_planned using gh CLI.
 * Uses warn-and-continue — never blocks on failure.
 */
async function closeGitHubEpic(
  projectRoot: string,
  slug: string,
): Promise<void> {
  const manifestPath = findManifestPath(projectRoot, slug);
  if (!manifestPath) return;

  let epicNumber: number | undefined;
  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    epicNumber = manifest.github?.epic;
  } catch {
    return;
  }

  if (!epicNumber) return;

  try {
    const proc = Bun.spawn(
      ["gh", "issue", "close", String(epicNumber), "--reason", "not_planned"],
      {
        cwd: projectRoot,
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      console.log(`[beastmode] GitHub epic #${epicNumber} closed as not_planned`);
    } else {
      console.warn(
        `[beastmode] Warning: GitHub close failed: ${stderr.trim()}`,
      );
    }
  } catch (err) {
    console.warn(
      `[beastmode] Warning: GitHub close failed: ${err instanceof Error ? err.message : err}`,
    );
  }
}
