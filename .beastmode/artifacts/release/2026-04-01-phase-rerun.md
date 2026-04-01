---
phase: release
slug: phase-rerun
epic: phase-rerun
bump: minor
---

# Release: phase-rerun

**Version:** v0.57.0
**Date:** 2026-04-01

## Highlights

Phase rerun support — overloads `beastmode <phase> <slug>` to detect regression/same-phase rerun and reset the branch to a predecessor tag, enabling users to redo any phase without starting a new epic. Replaces the hardcoded VALIDATE_FAILED transition with a generic REGRESS event in the XState machine.

## Features

- Phase detection matrix: regression, same-phase rerun, normal forward, forward-jump blocking
- Generic REGRESS event in XState epic machine with guard enforcement
- CLI-managed git tags (`beastmode/<slug>/<phase>`) for deterministic reset targets
- Tag lifecycle: create on phase completion, delete on regression, rename during slug rename
- Watch loop auto-regression from validate to implement on failure
- Confirmation prompt before destructive regression in manual CLI invocation
- Feature reset on regression past implement phase

## Full Changelog

- `de9f837` design(phase-rerun): checkpoint
- `f16d642` design(phase-rerun): checkpoint
- `e65b983` plan(phase-rerun): checkpoint
- `c4990b8` implement(watch-loop-regress): checkpoint
- `76fd9b6` implement(phase-tags): checkpoint
- `803546c` implement(regress-machine): checkpoint
- `9e6f6e9` implement(phase-detection): checkpoint
- `12777c4` implement(phase-tags): checkpoint
- `cea4b71` validate(phase-rerun): checkpoint
