---
phase: validate
slug: commit-issue-refs
status: passed
---

# Validation Report

## Status: PASS

### Tests

**commit-refs.test.ts:** 6/6 pass (0 fail)
- no-github-field returns empty string
- no-github-field with featureSlug returns empty string
- epic-only ref when no featureSlug
- epic-only ref when feature has no github.issue
- epic + feature refs when feature has github.issue
- epic-only ref when featureSlug doesn't match

**Full suite (excluding pre-existing args.test.ts failure):** 498/498 pass

**Pre-existing failure:** args.test.ts — `parseVerbosity` export removed from args.ts (not modified by this branch, confirmed via `git diff main`). Unrelated to commit-issue-refs.

### Lint

Skipped — not configured.

### Types

FAIL (pre-existing) — `bun x tsc --noEmit` reports 5 errors, all in `args.test.ts` and `index.ts` referencing the missing `parseVerbosity` export. No type errors in files modified by this branch.

### Custom Gates (Design Acceptance Criteria)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| `buildCommitRefs()` correct for epic-only | PASS | Test: "returns epic-only ref when no featureSlug provided" |
| `buildCommitRefs()` correct for epic+feature | PASS | Test: "returns epic + feature refs when feature has github.issue" |
| `buildCommitRefs()` correct for no-github-field | PASS | Test: "returns empty string when manifest has no github field" |
| Prompt contains `<commit-refs>` when github field exists | PASS | `watch-command.ts:286` appends `commitRefs` to prompt string |
| Prompt has no `<commit-refs>` when github field missing | PASS | `buildCommitRefs()` returns `""` — no block appended |
| Checkpoint commits contain `Refs #N` when refs present | PASS | All 5 skill checkpoint files updated with conditional `-m` args |
| Checkpoint commits unchanged when refs absent | PASS | All 5 skill checkpoint files have fallback without refs |
| Skills are manifest-unaware (read from prompt only) | PASS | Skills read `<commit-refs>` from prompt context, no manifest imports |
| Release commit uses epic-only ref | PASS | `release/phases/3-checkpoint.md:155` extracts only epic ref |
| Graceful no-op when no github field | PASS | `commit-refs.ts:18` returns `""` immediately |
