# Manifest Convergence

## Context
Parallel implement agents produce independent worktrees that must be merged before validation. Merge conflicts are possible and manifest completeness must be verified.

## Decision
Merge implement worktrees sequentially after all agents for an epic finish. Verify manifest shows all features completed. If merge conflicts arise, spawn a conflict-resolution agent to auto-resolve.

## Rationale
- Sequential merging provides deterministic ordering and simplifies conflict detection
- Manifest completeness check ensures no feature work is lost before advancing
- Auto-resolution agent removes human bottleneck for trivial conflicts

## Source
state/design/2026-03-28-orchestrator.md
