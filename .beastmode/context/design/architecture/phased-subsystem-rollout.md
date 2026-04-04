# Phased Subsystem Rollout

## Context
The structured-task-store epic needed to introduce a new persistence layer (`store.json`) that ultimately replaces N manifest files. A big-bang replacement risked breaking the pipeline mid-rollout. The design split delivery into PRD-1 (coexistence) and PRD-2 (absorption).

## Decision
New subsystems that replace existing infrastructure MUST be introduced in coexistence mode first:
- **PRD-1 / Foundation phase**: New subsystem runs alongside the existing one. Both coexist, neither blocks the other. Nothing breaks if the new subsystem has bugs — the old system still works.
- **PRD-2 / Absorption phase**: Old subsystem is retired. New subsystem takes full control. Migration happens only after the foundation is validated.

## Rationale
Coexistence mode provides a safe rollback boundary: if PRD-1 has bugs, reverting it leaves the pipeline fully functional. An all-at-once replacement would require a perfect first implementation or a full rollback. Coexistence also enables the new subsystem to be adopted incrementally — agents start using it while the old system provides continuity.

This pattern applies to any architectural replacement: new CLI command namespace, new data layer, new dispatch strategy, etc.

## Constraint
During coexistence, NEVER let the old system gain new capabilities — development energy should go into the new subsystem. The coexistence period is a bridge, not a permanent state.

## Source
.beastmode/artifacts/design/2026-04-04-structured-task-store.md
