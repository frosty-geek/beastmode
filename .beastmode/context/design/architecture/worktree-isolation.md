# Worktree Isolation

## Context
Implementation needs to execute complex plans without disrupting main branch or other agents.

## Decision
Isolated git worktrees in `.beastmode/worktrees/` for feature execution. Created at /design, inherited through plan/implement/validate, squash-merged by /release. Branch naming: `feature/<name>`. Agent-spawned worktrees use `isolation: "worktree"` on the Agent tool; skills inside agents detect existing worktree and skip their own creation. After parallel implement agents finish, worktrees merge sequentially with manifest completeness verification.

## Rationale
- Git worktrees provide branch isolation without stashing or switching
- Enables concurrent work on different features
- Clean squash merge on success produces scannable release history

## Source
state/design/2026-03-04-git-branching-strategy.md
state/design/2026-03-04-worktree-session-discovery.md
state/design/2026-03-28-orchestrator.md
