# Regression

## Context
The epic machine needed a way to move backward through phases when users discover issues in later phases. The only backward transition was a hardcoded VALIDATE_FAILED -> implement path.

## Decision
Generic REGRESS event (`{ type: "REGRESS", targetPhase: Phase }`) replaces VALIDATE_FAILED. Guard enforces targetPhase <= currentPhase and targetPhase != "design". Actions: set phase to targetPhase, reset all features to pending when regressing to or past implement, clear blocked fields, clear downstream artifact entries. `regressPhase()` pure function in manifest.ts. VALIDATE_FAILED event, constants, and tests fully removed.

## Rationale
A single generic mechanism eliminates the VALIDATE_FAILED special case and enables regression from any phase to any valid earlier phase. Design is excluded because it is interactive. Full-phase feature reset at implement ensures no stale feature state persists. This is a strict generalization — the old VALIDATE_FAILED behavior is a subset (REGRESS with targetPhase "implement").

## Source
.beastmode/artifacts/design/2026-04-01-phase-rerun.md
.beastmode/artifacts/implement/2026-04-01-phase-rerun-regress-machine.md
