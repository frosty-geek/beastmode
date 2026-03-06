# Phase Mapping

## Context
Need a fixed mapping from each phase to its successor for auto-transitions.

## Decision
Linear five-phase order: design -> plan -> implement -> validate -> release. Each transition gate is namespaced: `transitions.design-to-plan`, `transitions.plan-to-implement`, `transitions.implement-to-validate`, `transitions.validate-to-release`. No skipping phases.

## Rationale
- Linear order enforces discipline — every feature goes through all phases
- Namespaced gate IDs make config.yaml self-documenting
- No skip mechanism prevents incomplete features from reaching release

## Source
state/design/2026-03-04-fix-auto-transitions.md
