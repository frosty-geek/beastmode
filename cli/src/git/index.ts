// Core git helpers
export { git, gitCheck } from "./worktree.js";
export type { GitResult } from "./worktree.js";

// Worktree lifecycle
export {
  isInsideWorktree,
  resolveMainCheckoutRoot,
  resolveMainBranch,
  create,
  cleanArtifactOutputs,
  exists,
  ensureWorktree,
  enter,
  archive,
  remove,
  rebase,
} from "./worktree.js";
export type { WorktreeInfo, RebaseOutcome, RebaseResult } from "./worktree.js";

// Tag operations
export { tagName, createTag, deleteTags, deleteAllTags, renameTags, listTags } from "./tags.js";

// Push operations
export { hasRemote, pushBranches, pushTags } from "./push.js";
export type { PushBranchesOpts } from "./push.js";

// Commit issue references
export {
  resolveIssueNumber,
  appendIssueRef,
  resolveCommitIssueNumber,
  resolveRangeStart,
  amendCommitsInRange,
  amendCommitWithIssueRef,
} from "./commit-issue-ref.js";
export type { IssueRefFeature, AmendRangeResult } from "./commit-issue-ref.js";
