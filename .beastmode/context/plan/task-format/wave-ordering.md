# Wave Ordering

## Context
Tasks have dependencies — some must complete before others can start. A simple ordering mechanism is needed.

## Decision
Wave numbers (integer, default 1) determine execution order. Wave 1 runs before Wave 2, etc. Within a wave, `Depends on: Task N` creates ordering. Tasks in the same wave with no dependencies can potentially run in parallel.

## Rationale
Wave-based ordering is simpler than full DAG dependency resolution while still capturing the essential parallelism structure. Most plans naturally group into 2-4 waves.

## Source
state/plan/2026-03-04-plan-skill-improvements.md
