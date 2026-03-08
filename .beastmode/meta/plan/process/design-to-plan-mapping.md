# Design-to-Plan Mapping

## Observation 1
### Context
During hitl-gate-config planning, 2026-03-04
### Observation
Plan from design is straightforward when design is detailed. The design doc's "Components" section mapped 1:1 to plan tasks. Acceptance criteria transferred directly to verification steps.
### Rationale
Investing in detailed design pays off in planning speed
### Source
state/plan/2026-03-04-hitl-gate-config.md
### Confidence
[MEDIUM] — third observation confirming pattern

## Observation 2
### Context
During readme-star-patterns planning, 2026-03-04
### Observation
Research files can substitute for design docs when they have comprehensive competitive analysis, concrete recommendations with priorities, and codebase context. A formal design doc adds value for architectural decisions, not for content rewrites.
### Rationale
Not all planning inputs need to come from the design phase
### Source
state/plan/2026-03-04-readme-star-patterns.md
### Confidence
[MEDIUM] — third observation confirming pattern

## Observation 3
### Context
During phase-end-guidance planning, 2026-03-08
### Observation
Design doc's 6-component breakdown (visual language spec, retro ban, context report fix, 4 checkpoint standardizations) mapped to 7 plan tasks with near-1:1 correspondence. The design's "Locked Decisions" table (output format, guidance authority, ownership separation) translated directly into format constraints applied uniformly across all tasks. Wave structure (independent foundation vs. dependent standardization) emerged naturally from the component dependency graph.
### Rationale
Third confirmation that detailed design components map directly to plan tasks. The "Locked Decisions" pattern is a useful additional signal: locked decisions become the standardization constraints that unify related tasks.
### Source
state/plan/2026-03-08-phase-end-guidance.md
### Confidence
[MEDIUM] — third feature observation confirming the pattern
