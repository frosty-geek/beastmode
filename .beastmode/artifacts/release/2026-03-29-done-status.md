---
phase: release
slug: done-status
bump: minor
---

# Release: done-status

**Bump:** minor
**Date:** 2026-03-29

## Highlights

Rewrites state reconciliation to be phase-specific and inline, replacing the generic phase-output module. Adds the done-status PRD for terminal pipeline lifecycle states.

## Features

- Inline phase-specific state reconciliation in watch-command (plan scanning, feature marking, phase advancement)
- `NEXT_PHASE` map replaces imported `shouldAdvance`/`regressPhase` for phase transitions
- Plan reconciliation scans worktree for feature `.md` files and enriches manifest directly
- Artifact copying from worktree to project root during reconciliation

## Chores

- Removed `phase-output.ts` module (replaced by inline reconciliation)
- Removed `cli/test/watch.test.ts` (stale tests for deleted module)
- Cleaned up previous `polling-behaviour` release artifacts
- Simplified `post-dispatch.ts` imports and logic
- Removed unused exports from `manifest.ts` (`shouldAdvance`, `regressPhase`)

## Full Changelog

- `af9b1d0` design(done-status): checkpoint
- Working tree: watch-command.ts rewrite, phase-output.ts removal, test updates, artifact cleanup
