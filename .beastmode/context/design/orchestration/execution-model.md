# Execution Model

## Context
Beastmode needs a way to automatically advance multiple epics through the pipeline without manual phase invocations per epic.

## Decision
CronCreate recurring poll loop at 1-minute interval. Scans `.beastmode/state/` directories to determine next action per epic. Local state files are the sole authority for orchestration decisions. Design phase is excluded — the orchestrator picks up epics that have a design artifact but no release artifact.

## Rationale
- CronCreate is session-scoped and expires after 7 days, providing natural cleanup
- Polling at 1-minute intervals balances responsiveness with resource usage
- Local file authority avoids GitHub API rate limiting and keeps the orchestrator self-contained
- Excluding design preserves the interactive, human-collaborative nature of the design phase

## Source
state/design/2026-03-28-orchestrator.md
