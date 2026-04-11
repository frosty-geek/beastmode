---
phase: plan
slug: 00f823
epic: sync-log-hygiene
feature: phase-ordering-utility
wave: 1
---

# Phase Ordering Utility

**Design:** `.beastmode/artifacts/design/2026-04-11-00f823.md`

## User Stories

4. As a developer, I want a phase-ordering utility that answers "has phase X completed?" given the current phase, so that phase-aware gates are centralized and testable.

## What to Build

Add an `isPhaseAtOrPast(current: Phase, threshold: Phase): boolean` function to the shared types module where `phaseIndex()` and `PHASE_ORDER` already live. The function returns `true` when the current phase is at or past the threshold in the workflow progression.

Semantics:
- Workflow phases use their index in `PHASE_ORDER` for comparison
- Terminal phases (`done`, `cancelled`) are treated as past all workflow phases — return `true` for any threshold
- If the threshold itself is a terminal phase, only terminal phases satisfy it

Unit tests cover: each boundary pair (design/plan, plan/implement, etc.), terminal phases against all thresholds, identity cases (phase equals threshold), and the full matrix of workflow progression.

## Integration Test Scenarios

<!-- No behavioral scenarios — skip gate classified this feature as non-behavioral -->

## Acceptance Criteria

- [ ] `isPhaseAtOrPast("design", "plan")` returns `false`
- [ ] `isPhaseAtOrPast("implement", "plan")` returns `true`
- [ ] `isPhaseAtOrPast("plan", "plan")` returns `true` (identity)
- [ ] `isPhaseAtOrPast("done", "release")` returns `true` (terminal past all)
- [ ] `isPhaseAtOrPast("cancelled", "design")` returns `true` (terminal past all)
- [ ] Function is exported and importable by sync module
- [ ] Unit tests pass for all boundary and terminal cases
