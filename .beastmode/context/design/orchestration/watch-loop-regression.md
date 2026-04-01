# Watch Loop Regression

## Context
The watch loop had a hardcoded VALIDATE_FAILED transition for auto-regressing from validate to implement on failure. This was the only automated backward transition.

## Decision
Watch loop sends generic REGRESS event with targetPhase "implement" on validate failure instead of VALIDATE_FAILED. No confirmation prompt in automated mode. Same code path as manual regression — only the prompt is skipped.

## Rationale
Replacing VALIDATE_FAILED with REGRESS unifies the regression mechanism. The watch loop is automated and non-interactive, so skipping the confirmation prompt is correct. Using the same REGRESS event means the watch loop benefits from any future regression enhancements without code changes.

## Source
.beastmode/artifacts/design/2026-04-01-phase-rerun.md
.beastmode/artifacts/implement/2026-04-01-phase-rerun-watch-loop-regress.md
