# Design Coverage

## Context
Plans must fully cover all design components. Missing coverage means features ship incomplete.

## Decision
/plan's validate phase extracts all components from the design doc, verifies each appears in at least one plan task. Coverage table printed. Missing components trigger return to execute phase.

## Rationale
Automated coverage checking prevents the common failure mode where a design component gets overlooked during planning.

## Source
state/plan/2026-03-04-plan-skill-improvements.md
