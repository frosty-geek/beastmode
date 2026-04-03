---
phase: implement
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment-3d61b1
feature: issue-enrichment
status: completed
---

# Implementation Deviations: issue-enrichment

**Date:** 2026-04-03
**Feature Plan:** .beastmode/artifacts/plan/2026-04-03-github-issue-enrichment-3d61b1-issue-enrichment.md
**Tasks completed:** 3/3
**Deviations:** 6 total

## Auto-Fixed

- Task 0: Prior commit had `gitMetadata` with wrong type shape (`mergeCommit?: string`, `phaseTags?: string[]`). Replaced with plan-specified shape (`mergeCommit?: { sha: string; url: string }`, `phaseTags?: Record<string, string>`).
- Task 0: Prior commit had rendering logic using `input.repo` for URL construction and `**Phase Tags:**` label. Replaced with `**Tags:**` label and `mergeCommit.url` for direct URL.
- Task 1: `ghIssueComment` already existed from prior feature commit (caf81ef). No changes needed.
- Task 2: Import referenced `formatReleaseComment` but body-format.ts exports `formatClosingComment`. Fixed import name.
- Task 2: `SyncResult` interface had `commentsPosted: number` instead of `releaseCommentPosted: boolean`. Fixed to match test expectations.

## Blocking

- Task 2: Test for "no git metadata when no worktree" failed because `resolveGitMetadata` found real repo tags for slug `test-epic`. Fixed by gating tag lookups on worktree presence and using unique slug in test.

## Architectural

None.
