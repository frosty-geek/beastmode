# Parallel Execution

## Context
Sequential task execution in /implement was slow. Independent tasks can run concurrently.

## Decision
/implement executes tasks in parallel batches of up to 3 independent tasks. Batch selection filters pending tasks with no unmet dependencies. No per-task commits. Failed tasks marked as blocked; batch continues.

## Rationale
Parallel execution significantly reduces implementation time. Batch size of 3 balances parallelism with manageability. Deferring commits aligns with unified commit strategy.

## Source
state/plan/2026-03-01-implement-skill-refactor.md
