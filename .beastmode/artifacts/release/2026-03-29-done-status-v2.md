---
phase: release
slug: done-status-v2
bump: minor
---

# Release: done-status-v2

**Bump:** minor
**Date:** 2026-03-29

## Highlights

Adds `done` and `cancelled` as first-class terminal Phase values. Completed epics now automatically transition to `phase: "done"`, close on GitHub, move to the Done column, and filter out of the default status view. The `--all` flag shows historical epics when needed.

## Features

- Terminal phases: `done` and `cancelled` added to the Phase type union, VALID_PHASES, and PHASE_SEQUENCE
- `shouldAdvance` returns `"done"` for release phase with completed output status
- `deriveNextAction` returns null for both terminal phases — watch loop naturally skips them
- `cancel()` simplified: no more `as Phase` type cast, `"cancelled"` is a valid Phase
- GitHub sync: `PHASE_TO_BOARD_STATUS` maps `done` to "Done" column, epic issues auto-close
- Status filtering: `buildStatusRows` hides done/cancelled epics by default
- `--all` flag on `beastmode status` to show all epics including done/cancelled
- `colorPhase`: green+dim for done, red+dim for cancelled
- PHASE_ORDER: done sinks below active work (5), cancelled rises to top (-1)
- Removed `phase === "release" && nextAction === null` heuristic from formatStatus

## Fixes

- Pre-reconcile worktree outputs in scanner to prevent stale data
- Preserve manifests after release completes

## Full Changelog

- `e105bc4` validate(done-status-v2): checkpoint
- `0207865` implement(terminal-phases): checkpoint
- `95a6d3b` implement(status-filtering): checkpoint
- `b131119` implement(done-status-v2): checkpoint
- `9500ec1` plan(done-status-v2): checkpoint
- `fdd1ed9` design(done-status-v2): checkpoint
- `1922351` fix: pre-reconcile worktree outputs in scanner, preserve manifests after release
