# Regression

## Context
The implement-phase pipeline machine context needed to reflect the new REGRESS event that replaces VALIDATE_FAILED in the epic machine.

## Decision
REGRESS event (`{ type: "REGRESS", targetPhase }`) added as valid from every non-terminal epic state. Guard enforces targetPhase <= currentPhase and targetPhase != "design". Actions reset phase, clear features to pending when regressing to/past implement, clear blocked and downstream artifacts. VALIDATE_FAILED event, its type constant, and its two legacy tests are fully removed from types.ts, index.ts, and epic.ts.

## Rationale
Generic REGRESS replaces the special-case VALIDATE_FAILED with zero behavioral regression — the old behavior is a strict subset (REGRESS with targetPhase "implement"). Removing VALIDATE_FAILED entirely prevents drift between the two mechanisms.

## Source
.beastmode/artifacts/implement/2026-04-01-phase-rerun-regress-machine.md
