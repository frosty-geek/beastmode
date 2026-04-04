---
phase: plan
slug: 1581c9
epic: impl-branch-naming
feature: impl-branch-core
wave: 1
---

# impl-branch-core

**Design:** .beastmode/artifacts/design/2026-04-04-1581c9.md

## User Stories

1. As the CLI watch loop, I want to create `impl/<slug>--<feature>` branches before dispatching feature agents, so that fan-out dispatch never fails due to git ref conflicts.
3. As a developer running `beastmode implement <epic> <feature>` manually, I want the CLI to create the impl branch before dispatch using the same codepath as the watch loop, so that manual and automated flows behave identically.
4. As a developer rerunning implement after a failure, I want impl branch creation to be idempotent (skip if exists), so that reruns work without manual cleanup.
5. As the release phase, I want impl branches cleaned up alongside the worktree at release time, so that stale refs don't accumulate.
6. As the pipeline machine on regression, I want impl branches preserved (not deleted) when regressing to implement, so that existing work-in-progress is reusable with idempotent branch creation.

## What to Build

### Naming Utility

A pure function `implBranchName(slug, feature)` that returns the canonical `impl/<slug>--<feature>` branch name. Single source of truth for the naming convention — all callers use this function, never string interpolation.

### Idempotent Branch Creation

A function `createImplBranch(slug, feature, opts)` in the worktree module that:
- Computes the branch name via `implBranchName()`
- Checks if the branch already exists (git branch --list)
- If not, creates it from the current worktree HEAD (git branch <name>)
- Returns the branch name regardless of whether it was created or already existed

### CLI Dispatch Integration

Both dispatch codepaths call `createImplBranch()` before launching the implement session:
- **Watch loop** (`dispatchFanOut`): call `createImplBranch()` for each feature before `sessionFactory.create()`
- **Manual CLI** (`phaseCommand`): call `createImplBranch()` when phase is implement, before dispatch

Both use the same function — no divergent codepaths.

### Release Cleanup

Extend the worktree removal flow to also delete all `impl/<slug>--*` branches when removing a worktree. The `remove()` function (or a new companion) should list and delete all impl branches matching the slug pattern. This runs at release time alongside worktree cleanup.

### Regression Preservation

No code change needed — idempotent branch creation naturally handles reruns. The `createImplBranch()` function skips creation when the branch exists, preserving work-in-progress on regression to implement.

### Tests

Unit tests for `implBranchName()` verifying naming convention output. Integration tests for `createImplBranch()` covering creation, idempotent skip, and error handling. Integration test verifying no git ref conflict between `feature/<slug>` (worktree branch) and `impl/<slug>--<feature>` (impl branch). Tests for impl branch cleanup at removal time. Follow existing test patterns in the worktree test suite (temp repos, git wrapper functions, cleanup).

## Acceptance Criteria

- [ ] `implBranchName("abc123", "my-feature")` returns `"impl/abc123--my-feature"`
- [ ] `createImplBranch()` creates the branch from worktree HEAD when it doesn't exist
- [ ] `createImplBranch()` skips creation and returns the name when branch already exists
- [ ] Watch loop calls `createImplBranch()` before dispatching each feature agent
- [ ] Manual CLI calls `createImplBranch()` before dispatching implement phase
- [ ] Both dispatch paths use the same `createImplBranch()` function
- [ ] Worktree removal deletes all `impl/<slug>--*` branches for the slug
- [ ] Creating `impl/<slug>--<feature>` does not conflict with existing `feature/<slug>` worktree branch
- [ ] All new functions have unit/integration tests
