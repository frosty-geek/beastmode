# Worktree Isolation

## Context
Implementation needs to execute complex plans without disrupting main branch or other agents. With external orchestration, worktrees are ephemeral per-session and feature branches are the durable handoff.

## Decision
Worktrees created via `claude --worktree` flag in `.claude/worktrees/` (Claude Code default). WorktreeCreate hook branches from `feature/<slug>` if it exists, otherwise from origin/HEAD. Worktrees are ephemeral — human controls cleanup via Claude's interactive prompt at session end. Feature branches persist work across sessions. Skills do not manage worktree lifecycle. Agent-spawned worktrees use `isolation: "worktree"` on the Agent tool; skills inside agents detect existing worktree and skip their own creation. After parallel implement agents finish, worktrees merge sequentially with manifest completeness verification.

## Rationale
- Git worktrees provide branch isolation without stashing or switching
- Ephemeral worktrees with durable feature branches decouple session lifetime from work lifetime
- WorktreeCreate hook bridges Claude Code's native worktree support with beastmode's feature branch model
- Moving to `.claude/worktrees/` aligns with Claude Code defaults — no custom directory needed

## Source
state/design/2026-03-04-git-branching-strategy.md
state/design/2026-03-04-worktree-session-discovery.md
state/design/2026-03-28-external-orchestrator.md
state/design/2026-03-28-orchestrator.md
