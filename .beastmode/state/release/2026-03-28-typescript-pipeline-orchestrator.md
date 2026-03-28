# Release: typescript-pipeline-orchestrator

**Version:** v0.26.0
**Date:** 2026-03-28

## Highlights

Removed the TypeScript pipeline orchestrator CLI in favor of native Claude Code skill-based orchestration. ~5,100 lines of TypeScript deleted, L2 orchestration context rewritten to reflect the skill-native approach.

## Breaking Changes

- **CLI removed** — Entire `cli/` directory deleted: `run`, `watch`, `status` commands, state scanner, merge coordinator, worktree manager, dispatch tracker, and all tests (~5,100 lines)

## Features

- **Orchestration context rewrite** — L2 docs under `context/design/orchestration/` rewritten for skill-based approach: agent-spawning, manifest-convergence, team-organization replace CLI-centric agent-dispatching, merge-strategy, recovery
- **Tech stack cleanup** — L2 tech-stack docs updated to remove Bun/TypeScript CLI references
- **Phase transitions update** — Transition mechanism and gate output docs updated for Justfile-based orchestration

## Chores

- Removed stale plan/implement artifacts (7 feature plans, 7 task files, manifest JSON)
- Removed stale validate report
- Removed scope-management meta doc

## Full Changelog

- `f96ac81` release(typescript-pipeline-orchestrator): checkpoint
