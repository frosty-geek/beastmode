# Context Reports

## Context
Users need to know when to continue a session versus start a new one as context windows fill up. Multiple components (retro, context report, transition gate) were all printing next-step commands, causing duplicates.

## Decision
Shared template `skills/_shared/context-report.md` imported at the end of each phase skill. Reports token usage, loaded artifacts, phase position, and context-percentage handoff guidance (from visual-language.md). Context reports describe context state only — they never include next-step commands or transition guidance. The transition gate in checkpoint sub-phases has exclusive authority over next-step output.

## Rationale
Context window management is critical for multi-phase sessions. Standardized reports at phase boundaries give users actionable information. Separating context state reporting from transition commands eliminates duplicate next-step output and establishes a single source of truth for "what to do next."

## Source
state/plan/2026-03-01-phase-context-report.md
state/plan/2026-03-08-phase-end-guidance.md
