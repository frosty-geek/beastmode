---
phase: plan
slug: epic-tab-cleanup
epic: epic-tab-cleanup
feature: release-cleanup
wave: 1
---

# Release Cleanup

**Design:** .beastmode/artifacts/design/2026-04-03-epic-tab-cleanup.md

## User Stories

1. As a user running the pipeline, I want epic tabs to close automatically when release succeeds, so that iTerm2 doesn't accumulate leftover windows.

## What to Build

Wire the existing `cleanup()` call into ReconcilingFactory's release teardown path. The release success block currently archives the branch, removes the worktree, and marks the manifest as done — but never tells the inner factory to close its container (tab or workspace). Add `this.inner.cleanup?.(epicSlug)` after the worktree removal and manifest update, so the terminal container closes automatically.

Both `ITermSessionFactory.cleanup()` and `CmuxSessionFactory.cleanup()` already implement correct teardown logic. The bug is purely that ReconcilingFactory never invokes them on the success path.

Extend the existing test suite for ReconcilingFactory to verify:
- Cleanup is called on the inner factory after successful release
- Cleanup is NOT called on failed release
- Cleanup failure does not block the rest of the teardown (best-effort)

## Acceptance Criteria

- [ ] ReconcilingFactory calls `this.inner.cleanup?.(epicSlug)` in the release success path
- [ ] Cleanup call is placed after worktree removal and manifest update (so all persistent state is settled before closing the visual container)
- [ ] Cleanup failure is caught and logged but does not roll back the release
- [ ] Test: mock inner factory verifies cleanup called on release success
- [ ] Test: mock inner factory verifies cleanup NOT called on release failure
