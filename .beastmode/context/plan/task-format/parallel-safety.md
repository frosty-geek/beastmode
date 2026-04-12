# Parallel Safety

## Context
Parallel task dispatch within a wave requires guaranteeing no file conflicts between agents.

## Decision
/implement's Write Tasks step runs a dependency analysis algorithm: builds file-to-task map, detects import-chain and type-flow dependencies, resolves file conflicts by resequencing tasks to later waves, computes wave numbers via topological sort (longest-path from root), and marks conflict-free waves with `Parallel-safe: true`. A Wave Isolation Table in `.tasks.md` makes per-wave file assignments and conflict status visible. At runtime, /implement verifies the flag and dispatches parallel-safe waves by spawning all agents simultaneously in one message. Non-parallel-safe waves fall back to sequential dispatch.

## Rationale
Three-layer safety (dependency analysis + Wave Isolation Table + runtime verification) prevents file conflicts. The flag is machine-written by the dependency analysis algorithm in Write Tasks, never human-authored. Reviews run sequentially after all parallel implementations complete to ensure reviewers see the final file state.

## Feature-Level Isolation
File isolation analysis applies at feature level in multi-feature epics, not just
at task level within a single feature plan. When two features in the same wave
share file targets, the later feature must be moved to a subsequent wave. The
release-serialization epic demonstrated this: release-held-event (wave 1)
implemented functionality that release-gate (wave 1) also targeted, causing the
gate feature to find its work already done and only add tests.

## Source
state/plan/2026-03-04-parallel-wave-upgrade-path.md
