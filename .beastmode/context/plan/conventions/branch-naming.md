# Branch Naming

## Context
Feature development requires branch isolation. The naming convention must be consistent across all phases.

## Decision
Feature branches use `feature/<feature>` naming. Worktrees created at `.beastmode/worktrees/<feature>`. /design creates both, all subsequent phases inherit. /release merges to main, deletes worktree, and cleans up the branch.

## Rationale
`feature/<feature>` aligns with industry convention. Worktrees under `.beastmode/` consolidate all beastmode artifacts under one root. /release owning the merge gives a clear "ship it" moment.

## Source
state/plan/2026-03-04-git-branching-strategy.md
