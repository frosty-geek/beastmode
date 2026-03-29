/**
 * GitHub Sync Engine — stateless reconciliation from manifest to GitHub.
 *
 * Reads the manifest and makes GitHub match. One-way sync:
 * manifest is the source of truth, GitHub is a mirror.
 *
 * Bootstrap write-back: when creating issues, writes numbers back
 * to the manifest (the sole exception to one-way sync).
 */

import type { PipelineManifest, ManifestFeature } from "./manifest";
import type { BeastmodeConfig, GitHubConfig } from "./config";
import {
  ghIssueCreate,
  ghIssueEdit,
  ghIssueClose,
  ghIssueLabels,
  ghProjectItemAdd,
  ghProjectSetField,
  ghSubIssueAdd,
} from "./gh";

/** Result of a sync operation — informational, never throws. */
export interface SyncResult {
  epicCreated: boolean;
  epicNumber?: number;
  featuresCreated: number;
  featuresClosed: number;
  labelsUpdated: number;
  projectUpdated: boolean;
  epicClosed: boolean;
  warnings: string[];
}

/** Map manifest phase to the project board status name. */
const PHASE_TO_BOARD_STATUS: Record<string, string> = {
  design: "Design",
  plan: "Plan",
  implement: "Implement",
  validate: "Validate",
  release: "Release",
};

/** Map manifest feature status to GitHub label. */
const STATUS_TO_LABEL: Record<string, string> = {
  pending: "status/ready",
  "in-progress": "status/in-progress",
  blocked: "status/blocked",
};

/** All possible status/* labels for blast-replace. */
const ALL_STATUS_LABELS = ["status/ready", "status/in-progress", "status/blocked"];

/** All possible phase/* labels for blast-replace. */
const ALL_PHASE_LABELS = [
  "phase/backlog",
  "phase/design",
  "phase/plan",
  "phase/implement",
  "phase/validate",
  "phase/release",
  "phase/done",
];

/**
 * Sync GitHub state to match the manifest. Stateless — reads manifest,
 * makes GitHub match. Returns SyncResult for logging.
 *
 * Mutates `manifest` in-place for bootstrap write-back (epic/feature issue numbers).
 * Caller is responsible for persisting the manifest after sync.
 */
export async function syncGitHub(
  manifest: PipelineManifest,
  config: BeastmodeConfig,
): Promise<SyncResult> {
  const result: SyncResult = {
    epicCreated: false,
    featuresCreated: 0,
    featuresClosed: 0,
    labelsUpdated: 0,
    projectUpdated: false,
    epicClosed: false,
    warnings: [],
  };

  // Guard: GitHub must be enabled
  if (!config.github.enabled) {
    result.warnings.push("GitHub sync disabled in config");
    return result;
  }

  // Need a repo to sync to
  const repo = manifest.github?.repo;
  if (!repo) {
    result.warnings.push("No github.repo in manifest — skipping sync");
    return result;
  }

  const [owner] = repo.split("/");

  // --- Epic Sync ---

  // Create epic if missing
  if (!manifest.github?.epic) {
    const epicNumber = await ghIssueCreate(
      repo,
      manifest.slug,
      `## ${manifest.slug}\n\n**Phase:** ${manifest.phase}`,
      ["type/epic", `phase/${manifest.phase}`],
    );
    if (epicNumber) {
      if (!manifest.github) {
        manifest.github = { epic: epicNumber, repo };
      } else {
        manifest.github.epic = epicNumber;
      }
      result.epicCreated = true;
      result.epicNumber = epicNumber;
    } else {
      result.warnings.push("Failed to create epic issue");
      return result; // Can't proceed without epic
    }
  }

  const epicNumber = manifest.github.epic;
  result.epicNumber = epicNumber;

  // Blast-replace phase label on epic
  const targetPhaseLabel = `phase/${manifest.phase}`;
  const currentLabels = await ghIssueLabels(repo, epicNumber);
  if (currentLabels) {
    const currentPhaseLabels = currentLabels.filter((l) =>
      l.startsWith("phase/"),
    );
    const needsUpdate =
      currentPhaseLabels.length !== 1 ||
      currentPhaseLabels[0] !== targetPhaseLabel;
    if (needsUpdate) {
      await ghIssueEdit(repo, epicNumber, {
        removeLabels: ALL_PHASE_LABELS.filter((l) => currentLabels.includes(l)),
        addLabels: [targetPhaseLabel],
      });
      result.labelsUpdated++;
    }
  }

  // Update project board status for epic
  await syncProjectStatus(
    config.github,
    owner,
    repo,
    epicNumber,
    PHASE_TO_BOARD_STATUS[manifest.phase] ?? "Backlog",
    result,
  );

  // --- Feature Sync ---

  for (const feature of manifest.features) {
    await syncFeature(repo, owner, epicNumber, feature, config.github, result);
  }

  // --- Epic Close (if done) ---
  // Note: Phase type doesn't include "done", but after release the CLI
  // may set a custom state. Check for it as a string.
  if ((manifest.phase as string) === "done") {
    const closed = await ghIssueClose(repo, epicNumber);
    if (closed) {
      result.epicClosed = true;
    } else {
      result.warnings.push("Failed to close epic");
    }

    // Set project board to Done
    await syncProjectStatus(config.github, owner, repo, epicNumber, "Done", result);
  }

  return result;
}

/**
 * Sync a single feature to GitHub.
 */
async function syncFeature(
  repo: string,
  owner: string,
  epicNumber: number,
  feature: ManifestFeature,
  githubConfig: GitHubConfig,
  result: SyncResult,
): Promise<void> {
  // Create feature issue if missing
  if (!feature.github?.issue) {
    const issueNumber = await ghIssueCreate(
      repo,
      feature.slug,
      `## ${feature.slug}\n\n**Epic:** #${epicNumber}`,
      ["type/feature", STATUS_TO_LABEL[feature.status] ?? "status/ready"],
    );
    if (issueNumber) {
      feature.github = { issue: issueNumber };
      result.featuresCreated++;

      // Link as sub-issue of epic
      await ghSubIssueAdd(repo, epicNumber, issueNumber);
    } else {
      result.warnings.push(`Failed to create issue for feature ${feature.slug}`);
      return;
    }
  }

  const featureNumber = feature.github.issue;

  // Handle completed features — close them
  if (feature.status === "completed") {
    const closed = await ghIssueClose(repo, featureNumber);
    if (closed) {
      result.featuresClosed++;
    } else {
      result.warnings.push(`Failed to close feature ${feature.slug}`);
    }
    return; // No label update needed for closed issues
  }

  // Blast-replace status label
  const targetStatusLabel = STATUS_TO_LABEL[feature.status];
  if (targetStatusLabel) {
    const currentLabels = await ghIssueLabels(repo, featureNumber);
    if (currentLabels) {
      const currentStatusLabels = currentLabels.filter((l) =>
        l.startsWith("status/"),
      );
      const needsUpdate =
        currentStatusLabels.length !== 1 ||
        currentStatusLabels[0] !== targetStatusLabel;
      if (needsUpdate) {
        await ghIssueEdit(repo, featureNumber, {
          removeLabels: ALL_STATUS_LABELS.filter((l) =>
            currentLabels.includes(l),
          ),
          addLabels: [targetStatusLabel],
        });
        result.labelsUpdated++;
      }
    }
  }

  // Update project board status for feature
  const featureBoardStatus = featureStatusToBoardStatus(feature.status);
  if (featureBoardStatus) {
    await syncProjectStatus(
      githubConfig,
      owner,
      repo,
      featureNumber,
      featureBoardStatus,
      result,
    );
  }
}

/**
 * Map feature status to project board status.
 */
function featureStatusToBoardStatus(
  status: ManifestFeature["status"],
): string | undefined {
  switch (status) {
    case "pending":
      return "Plan";
    case "in-progress":
      return "Implement";
    case "blocked":
      return "Plan";
    case "completed":
      return "Done";
    default:
      return undefined;
  }
}

/**
 * Sync an issue's project board status.
 * Requires Projects V2 metadata in config.
 */
async function syncProjectStatus(
  githubConfig: GitHubConfig,
  owner: string,
  repo: string,
  issueNumber: number,
  targetStatus: string,
  result: SyncResult,
): Promise<void> {
  const projectNumber = githubConfig["project-number"];
  const projectId = githubConfig["project-id"];
  const fieldId = githubConfig["field-id"];
  const fieldOptions = githubConfig["field-options"];

  if (!projectNumber || !projectId || !fieldId || !fieldOptions) {
    // Projects V2 not configured — skip silently
    return;
  }

  const optionId = fieldOptions[targetStatus];
  if (!optionId) {
    result.warnings.push(
      `No project option for status "${targetStatus}" — run setup-github to refresh`,
    );
    return;
  }

  const issueUrl = `https://github.com/${repo}/issues/${issueNumber}`;
  const itemId = await ghProjectItemAdd(projectNumber, owner, issueUrl);
  if (!itemId) {
    result.warnings.push(`Failed to add #${issueNumber} to project board`);
    return;
  }

  const updated = await ghProjectSetField(projectId, itemId, fieldId, optionId);
  if (updated) {
    result.projectUpdated = true;
  } else {
    result.warnings.push(`Failed to set project status for #${issueNumber}`);
  }
}
