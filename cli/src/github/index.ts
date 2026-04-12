// Discovery
export { discoverGitHub } from "./discovery.js";
export type { ResolvedGitHub } from "./discovery.js";

// Sync refs
export { loadSyncRefs, saveSyncRefs, getSyncRef, setSyncRef } from "./sync-refs.js";
export type { SyncRef, SyncRefs } from "./sync-refs.js";

// GitHub sync engine
export {
  syncGitHub,
  syncGitHubForEpic,
  formatEpicBody,
  formatFeatureBody,
  epicTitle,
  featureTitle,
  formatClosingComment,
  buildCompareUrl,
  buildArtifactsMap,
} from "./sync.js";
export type {
  EpicBodyInput,
  FeatureBodyInput,
  EpicSyncInput,
  FeatureSyncInput,
  CompareUrlInput,
  SyncMutation,
  SyncResult,
} from "./sync.js";

// Reconciliation
export { reconcileGitHub } from "./reconcile.js";
export type { ReconcileResult as GitHubReconcileResult, ReconcileOpts } from "./reconcile.js";

// Early issues
export { ensureEarlyIssues } from "./early-issues.js";
export type { EarlyIssueOpts } from "./early-issues.js";

// Branch linking
export { linkBranches } from "./branch-link.js";
export type { LinkBranchesOpts } from "./branch-link.js";

// Retry queue
export {
  enqueuePendingOp,
  drainPendingOps,
  resolvePendingOp,
  incrementRetry,
  hasPendingOps,
  computeNextRetryTick,
  MAX_RETRIES,
} from "./retry-queue.js";
export type { PendingOp, OpType, OpStatus, DrainedOp } from "./retry-queue.js";

// Raw gh CLI wrapper
export {
  gh,
  ghJson,
  ghGraphQL,
  ghRepoNodeId,
  ghIssueNodeId,
  ghCreateLinkedBranch,
  ghLabelCreate,
  ghIssueEdit,
  ghIssueCreate,
  ghIssueClose,
  ghIssueReopen,
  ghIssueComment,
  ghIssueState,
  ghIssueLabels,
  ghIssueComments,
  ghProjectItemAdd,
  ghProjectSetField,
  ghProjectItemDelete,
  ghRepoDiscover,
  ghProjectDiscover,
  ghFieldDiscover,
  ghSubIssueAdd,
} from "./cli.js";
export type { GhResult } from "./cli.js";
