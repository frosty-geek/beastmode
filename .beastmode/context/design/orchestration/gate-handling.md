# Gate Handling

## Context
The orchestrator must respect existing HITL gate configuration so that human-gated steps still require approval.

## Decision
Config.yaml gates are respected as-is during orchestration. When a gate is `human`, the agent blocks and messages the orchestrator, which relays to the user.

## Rationale
- Reusing config.yaml gate settings means no new configuration surface for orchestrated vs manual runs
- Message relay preserves human control without requiring the human to monitor each agent individually

## Source
state/design/2026-03-28-orchestrator.md
