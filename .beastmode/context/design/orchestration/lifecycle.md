# Lifecycle

## Context
The orchestrator needs explicit start/stop semantics and a natural cleanup mechanism for abandoned sessions.

## Decision
Start via `/beastmode orchestrate start`, stop via `/beastmode orchestrate stop` which calls CronDelete. No auto-drain or idle-timeout. CronCreate jobs are session-scoped and expire after 7 days.

## Rationale
- Explicit start/stop gives the developer full control over when orchestration is active
- No auto-drain avoids premature shutdown when the developer steps away temporarily
- Session-scoped CronCreate provides natural cleanup without orphaned background processes

## Source
state/design/2026-03-28-orchestrator.md
