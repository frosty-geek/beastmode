---
name: release
description: Create changelogs and release notes — releasing, documenting, shipping. Use after validate. Commits, merges, cleans up worktree.
---

# /release

Commit all changes, merge to main, cleanup worktree.

## Phases

0. [Prime](phases/0-prime.md) — Load artifacts, analyze changes
1. [Execute](phases/1-execute.md) — Generate changelog, create commit
2. [Validate](phases/2-validate.md) — Check merge readiness
3. [Checkpoint](phases/3-checkpoint.md) — Merge, cleanup, final retro

@_shared/task-runner.md
