/**
 * `beastmode sync [--clean]`
 *
 * Full reconciliation of all manifests against GitHub.
 *
 * Base sync: for each manifest, run syncGitHub and apply mutations.
 * --clean: close orphan issues, remove features from board, clean stale labels.
 */

import type { BeastmodeConfig } from "../config";
import { findProjectRoot } from "../project-root";
import * as store from "../manifest-store";
import type { PipelineManifest } from "../manifest-store";
import { syncGitHub, type SyncResult, type SyncMutation } from "../github-sync";
import { setGitHubEpic, setFeatureGitHubIssue } from "../manifest";
import {
  ghIssueList,
  ghIssueClose,
  ghLabelList,
  ghLabelDelete,
  ghProjectItemList,
  ghProjectItemRemove,
} from "../gh";

/** The complete label taxonomy — anything not in this set is stale. */
const LABEL_TAXONOMY = new Set([
  "type/epic",
  "type/feature",
  "phase/backlog",
  "phase/design",
  "phase/plan",
  "phase/implement",
  "phase/validate",
  "phase/release",
  "phase/done",
  "status/ready",
  "status/in-progress",
  "status/blocked",
]);

interface SyncSummary {
  manifestsSynced: number;
  issuesCreated: number;
  labelsUpdated: number;
  boardUpdated: number;
  warnings: string[];
  // Clean mode
  orphansClosed: number;
  boardItemsRemoved: number;
  staleLabelsRemoved: number;
}

/**
 * Apply sync mutations to a manifest. Returns the updated manifest.
 */
function applyMutations(
  manifest: PipelineManifest,
  mutations: SyncMutation[],
): PipelineManifest {
  let updated = manifest;
  for (const mutation of mutations) {
    switch (mutation.type) {
      case "setEpic":
        updated = setGitHubEpic(updated, mutation.epicNumber, mutation.repo);
        break;
      case "setFeatureIssue":
        updated = setFeatureGitHubIssue(
          updated,
          mutation.featureSlug,
          mutation.issueNumber,
        );
        break;
    }
  }
  return updated;
}

/**
 * Run base sync: reconcile all manifests against GitHub.
 */
async function runBaseSync(
  projectRoot: string,
  config: BeastmodeConfig,
  summary: SyncSummary,
): Promise<void> {
  const manifests = store.list(projectRoot);

  if (manifests.length === 0) {
    console.log("[sync] No manifests found.");
    return;
  }

  console.log(`[sync] Syncing ${manifests.length} manifest(s)...`);

  for (const manifest of manifests) {
    try {
      const result = await syncGitHub(manifest, config);

      // Apply mutations (write-back issue numbers)
      if (result.mutations.length > 0) {
        const enriched = applyMutations(manifest, result.mutations);
        store.save(projectRoot, manifest.slug, enriched);
      }

      // Accumulate summary
      summary.manifestsSynced++;
      summary.issuesCreated += (result.epicCreated ? 1 : 0) + result.featuresCreated;
      summary.labelsUpdated += result.labelsUpdated;
      if (result.projectUpdated) summary.boardUpdated++;
      summary.warnings.push(...result.warnings);

      const parts: string[] = [];
      if (result.epicCreated) parts.push(`epic #${result.epicNumber} created`);
      if (result.featuresCreated > 0) parts.push(`${result.featuresCreated} features created`);
      if (result.labelsUpdated > 0) parts.push(`${result.labelsUpdated} labels updated`);
      if (result.projectUpdated) parts.push("board updated");
      if (result.epicClosed) parts.push("epic closed");
      if (result.featuresClosed > 0) parts.push(`${result.featuresClosed} features closed`);

      const detail = parts.length > 0 ? parts.join(", ") : "up to date";
      console.log(`[sync] ${manifest.slug}: ${detail}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[sync] Warning: ${manifest.slug} sync failed: ${msg}`);
      summary.warnings.push(`${manifest.slug}: ${msg}`);
    }
  }
}

/**
 * Build a set of all issue numbers referenced by any manifest.
 */
function collectManifestIssueNumbers(manifests: PipelineManifest[]): Set<number> {
  const known = new Set<number>();
  for (const m of manifests) {
    if (m.github?.epic) known.add(m.github.epic);
    for (const f of m.features) {
      if (f.github?.issue) known.add(f.github.issue);
    }
  }
  return known;
}

/**
 * Run cleanup: close orphans, remove features from board, clean stale labels.
 */
async function runClean(
  projectRoot: string,
  config: BeastmodeConfig,
  summary: SyncSummary,
): Promise<void> {
  const repo = findRepoFromManifests(projectRoot);
  if (!repo) {
    console.log("[clean] No manifests have a github.repo — skipping cleanup.");
    return;
  }

  const [owner] = repo.split("/");
  const manifests = store.list(projectRoot);
  const knownIssues = collectManifestIssueNumbers(manifests);

  console.log("[clean] Running cleanup...");

  // 1. Close orphan issues (type/epic or type/feature that aren't in any manifest)
  await closeOrphanIssues(repo, knownIssues, summary);

  // 2. Remove features from project board (epics-only policy)
  await removeFeaturesFromBoard(config, owner, repo, summary);

  // 3. Remove stale labels
  await removeStaleLabels(repo, summary);
}

/**
 * Find the github repo from any manifest that has one.
 */
function findRepoFromManifests(projectRoot: string): string | undefined {
  const manifests = store.list(projectRoot);
  for (const m of manifests) {
    if (m.github?.repo) return m.github.repo;
  }
  return undefined;
}

/**
 * Close open GitHub issues that don't correspond to any active manifest.
 */
async function closeOrphanIssues(
  repo: string,
  knownIssues: Set<number>,
  summary: SyncSummary,
): Promise<void> {
  // Query all open issues with type/epic or type/feature labels
  const epics = await ghIssueList(repo, { labels: ["type/epic"], state: "open" });
  const features = await ghIssueList(repo, { labels: ["type/feature"], state: "open" });

  const allIssues = [...(epics ?? []), ...(features ?? [])];

  for (const issue of allIssues) {
    if (!knownIssues.has(issue.number)) {
      const closed = await ghIssueClose(repo, issue.number);
      if (closed) {
        console.log(`[clean] Closed orphan #${issue.number}: ${issue.title}`);
        summary.orphansClosed++;
      }
    }
  }
}

/**
 * Remove feature issues from the project board (epics-only policy).
 */
async function removeFeaturesFromBoard(
  config: BeastmodeConfig,
  owner: string,
  repo: string,
  summary: SyncSummary,
): Promise<void> {
  const projectNumber = config.github["project-number"];
  const projectId = config.github["project-id"];
  if (!projectNumber || !projectId) return;

  const items = await ghProjectItemList(projectNumber, owner);
  if (!items) return;

  // For each board item, check if it's a feature issue
  for (const item of items) {
    if (!item.content?.url) continue;

    // Extract issue number from URL
    const match = item.content.url.match(/\/issues\/(\d+)$/);
    if (!match) continue;
    const issueNumber = parseInt(match[1], 10);

    // Check if this issue has type/feature label — if so, remove from board
    const labels = await ghIssueList(repo, { labels: ["type/feature"], state: "all" });
    const isFeature = labels?.some((i) => i.number === issueNumber);
    if (isFeature) {
      const removed = await ghProjectItemRemove(projectNumber, owner, item.id);
      if (removed) {
        console.log(`[clean] Removed feature #${issueNumber} from board`);
        summary.boardItemsRemoved++;
      }
    }
  }
}

/**
 * Remove labels not in the taxonomy.
 */
async function removeStaleLabels(
  repo: string,
  summary: SyncSummary,
): Promise<void> {
  const labels = await ghLabelList(repo);
  if (!labels) return;

  // Only consider beastmode-managed labels (type/, phase/, status/ prefixes)
  const beastmodeLabels = labels.filter(
    (l) => l.startsWith("type/") || l.startsWith("phase/") || l.startsWith("status/"),
  );

  for (const label of beastmodeLabels) {
    if (!LABEL_TAXONOMY.has(label)) {
      const deleted = await ghLabelDelete(repo, label);
      if (deleted) {
        console.log(`[clean] Removed stale label: ${label}`);
        summary.staleLabelsRemoved++;
      }
    }
  }
}

/**
 * Print final summary.
 */
function printSummary(summary: SyncSummary, clean: boolean): void {
  console.log("");
  console.log("[sync] Summary:");
  console.log(`  Manifests synced: ${summary.manifestsSynced}`);
  console.log(`  Issues created:   ${summary.issuesCreated}`);
  console.log(`  Labels updated:   ${summary.labelsUpdated}`);
  console.log(`  Board updated:    ${summary.boardUpdated}`);

  if (clean) {
    console.log(`  Orphans closed:   ${summary.orphansClosed}`);
    console.log(`  Board items removed: ${summary.boardItemsRemoved}`);
    console.log(`  Stale labels removed: ${summary.staleLabelsRemoved}`);
  }

  if (summary.warnings.length > 0) {
    console.log("");
    console.log(`  Warnings (${summary.warnings.length}):`);
    for (const w of summary.warnings) {
      console.log(`    - ${w}`);
    }
  }
}

/**
 * Entry point: beastmode sync [--clean]
 */
export async function syncCommand(
  config: BeastmodeConfig,
  args: string[] = [],
): Promise<void> {
  const clean = args.includes("--clean");
  const projectRoot = findProjectRoot();

  if (!config.github.enabled) {
    console.log("[sync] GitHub sync is disabled in config. Enable with: github.enabled: true");
    return;
  }

  const summary: SyncSummary = {
    manifestsSynced: 0,
    issuesCreated: 0,
    labelsUpdated: 0,
    boardUpdated: 0,
    warnings: [],
    orphansClosed: 0,
    boardItemsRemoved: 0,
    staleLabelsRemoved: 0,
  };

  // Base sync — always runs
  await runBaseSync(projectRoot, config, summary);

  // Clean mode — additional cleanup
  if (clean) {
    await runClean(projectRoot, config, summary);
  }

  printSummary(summary, clean);
}
