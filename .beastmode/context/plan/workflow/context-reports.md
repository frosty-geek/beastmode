# Context Reports

## Context
Users need to know when to continue a session versus start a new one as context windows fill up.

## Decision
Shared template `skills/_shared/context-report.md` imported at the end of each phase skill. Reports token usage, loaded artifacts, phase position, and handoff options.

## Rationale
Context window management is critical for multi-phase sessions. Standardized reports at phase boundaries give users actionable information.

## Source
state/plan/2026-03-01-phase-context-report.md
