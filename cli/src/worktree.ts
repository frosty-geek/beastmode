/**
 * Worktree lifecycle manager — create, enter, exists, remove.
 *
 * Provides lifecycle operations only:
 *   create        — git worktree at .claude/worktrees/<slug> with feature/<slug> branch
 *   enter         — returns absolute path for use as cwd
 *   ensureWorktree — idempotent create-or-reuse
 *   exists        — checks if worktree exists for slug
 *   remove        — cleans up worktree directory and optionally deletes branch
 */

import { resolve } from "node:path";
import { copyFile, mkdir } from "node:fs/promises";
import { git, gitCheck } from "./git.js";

const WORKTREE_DIR = ".claude/worktrees";

export interface WorktreeInfo {
  slug: string;
  path: string;
  branch: string;
}

/**
 * Create a worktree at `.claude/worktrees/<slug>` with a `feature/<slug>` branch.
 *
 * If the branch exists (local or remote), checks it out.
 * Otherwise creates a new branch from origin/HEAD (or HEAD if no remote).
 * Prunes stale worktree references before creation.
 */
export async function create(
  slug: string,
  opts: { cwd?: string } = {},
): Promise<WorktreeInfo> {
  const cwd = opts.cwd;
  const branch = `feature/${slug}`;
  const wtPath = `${WORKTREE_DIR}/${slug}`;

  // Prune stale worktree references
  await git(["worktree", "prune"], { cwd, allowFailure: true });

  // Check if worktree already exists at the path
  const absPath = resolve(cwd ?? process.cwd(), wtPath);
  const existingWorktrees = await git(["worktree", "list", "--porcelain"], {
    cwd,
  });
  if (existingWorktrees.stdout.includes(absPath)) {
    // Worktree already exists — ensure settings are present
    await copySettingsLocal(cwd ?? process.cwd(), absPath);
    return { slug, path: absPath, branch };
  }

  // Check if feature branch exists locally
  const localExists = await gitCheck(
    ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`],
    { cwd },
  );

  // Check if feature branch exists on remote
  const remoteExists = await gitCheck(
    ["show-ref", "--verify", "--quiet", `refs/remotes/origin/${branch}`],
    { cwd },
  );

  if (localExists || remoteExists) {
    // Existing branch — create worktree from it
    await git(["worktree", "add", wtPath, branch], { cwd });
  } else {
    // New feature — create branch from origin/HEAD or HEAD
    const baseResult = await git(
      ["rev-parse", "--verify", "origin/HEAD"],
      { cwd, allowFailure: true },
    );
    const base =
      baseResult.exitCode === 0
        ? baseResult.stdout
        : (await git(["rev-parse", "HEAD"], { cwd })).stdout;

    await git(["worktree", "add", wtPath, "-b", branch, base], { cwd });
  }

  const absWtPath = resolve(cwd ?? process.cwd(), wtPath);

  // Copy .claude/settings.local.json so plugins are enabled in the worktree
  await copySettingsLocal(cwd ?? process.cwd(), absWtPath);

  return { slug, path: absWtPath, branch };
}

/**
 * Copy `.claude/settings.local.json` into a worktree so the SDK session
 * inherits plugin configuration (beastmode skills, etc.).
 *
 * Only copies if the worktree's `.claude/` dir already exists (git worktree
 * add creates it). Never creates the directory — that would break git
 * worktree add which expects a non-existent or empty target.
 */
async function copySettingsLocal(
  projectRoot: string,
  worktreePath: string,
): Promise<void> {
  const src = resolve(projectRoot, ".claude/settings.local.json");
  const destDir = resolve(worktreePath, ".claude");
  const dest = resolve(destDir, "settings.local.json");
  try {
    await mkdir(destDir, { recursive: true });
    await copyFile(src, dest);
  } catch {
    // Source doesn't exist or worktree not ready — nothing to copy
  }
}

/**
 * Check whether a worktree exists for the given slug.
 */
export async function exists(
  slug: string,
  opts: { cwd?: string } = {},
): Promise<boolean> {
  const cwd = opts.cwd;
  const wtPath = `${WORKTREE_DIR}/${slug}`;
  const absPath = resolve(cwd ?? process.cwd(), wtPath);

  await git(["worktree", "prune"], { cwd, allowFailure: true });

  const result = await git(["worktree", "list", "--porcelain"], { cwd });
  return result.stdout.includes(absPath);
}

/**
 * Ensure a worktree exists for the given slug.
 *
 * If the worktree already exists, returns its info without modification.
 * If it doesn't exist, creates one. This is the canonical entry point
 * for all phase commands — the idempotent create-or-reuse lifecycle.
 */
export async function ensureWorktree(
  slug: string,
  opts: { cwd?: string } = {},
): Promise<WorktreeInfo> {
  return create(slug, opts);
}

/**
 * Return the absolute path of a worktree for use as `cwd` in SDK sessions.
 */
export function enter(
  slug: string,
  opts: { cwd?: string } = {},
): string {
  return resolve(opts.cwd ?? process.cwd(), `${WORKTREE_DIR}/${slug}`);
}

/**
 * Remove a worktree and optionally delete its branch.
 */
export async function remove(
  slug: string,
  opts: { cwd?: string; deleteBranch?: boolean } = {},
): Promise<void> {
  const cwd = opts.cwd;
  const branch = `feature/${slug}`;
  const wtPath = `${WORKTREE_DIR}/${slug}`;

  // Remove the worktree (force to handle uncommitted changes)
  await git(["worktree", "remove", wtPath, "--force"], {
    cwd,
    allowFailure: true,
  });

  // Prune to clean up
  await git(["worktree", "prune"], { cwd, allowFailure: true });

  // Optionally delete the branch
  if (opts.deleteBranch !== false) {
    await git(["branch", "-D", branch], { cwd, allowFailure: true });
  }
}
