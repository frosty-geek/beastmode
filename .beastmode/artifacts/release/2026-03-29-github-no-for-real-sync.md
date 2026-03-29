---
phase: release
slug: github-no-for-real-sync
bump: minor
---

# Release: github-no-for-real-sync

**Version:** v0.45.0
**Date:** 2026-03-29

## Highlights

Unifies state reconciliation and release teardown into a shared `ReconcilingFactory` wrapper so both SDK and cmux dispatch paths get identical post-dispatch behavior. The output.json stop hook now processes all artifacts instead of just the most recent one.

## Features

- **Reconciling factory**: Extract state reconciliation and release teardown from `dispatchPhase` into `ReconcilingFactory`, eliminating duplication between SDK and cmux paths
- **Cmux dispatch strategy**: `watchCommand` reads `dispatch-strategy` from config, wires `CmuxSessionFactory` when cmux is available with graceful fallback
- **Output.json scan-all**: Stop hook scans ALL artifact .md files with frontmatter instead of only the most recent; uses mtime comparison for efficiency
- **Epic-level worktrees**: `dispatchPhase` always uses epic-level worktree slug, removing per-feature worktree creation

## Chores

- Clarify implement checkpoint "Next:" handoff message wording

## Full Changelog

- `cli/src/watch-command.ts`: +140/-35 — ReconcilingFactory, cmux strategy wiring, epic-level worktrees
- `scripts/generate-output-json.sh`: +78/-81 — Refactor to scan-all with per-artifact output generation
- `skills/implement/phases/3-checkpoint.md`: +4/-2 — Handoff wording fix
