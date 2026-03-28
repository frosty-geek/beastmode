## Context
The original scanner included cost aggregation from .beastmode-runs.json as part of the EpicState type.

## Decision
Remove costUsd from EpicState. Cost aggregation is a separate concern handled by beastmode status.

## Rationale
Scanner's job is to report epic state for orchestration decisions. Cost reporting is a display concern that belongs in the status command, not the scan loop.

## Source
.beastmode/state/design/2026-03-29-bulletproof-state-scanner.md
