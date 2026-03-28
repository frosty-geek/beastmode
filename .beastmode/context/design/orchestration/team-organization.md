# Team Organization

## Context
Agents working on the same epic need a communication channel. Different epics should have isolated communication.

## Decision
One team per epic, named `pipeline-<epic-slug>`. Created when an epic first needs work, cleaned up when the epic reaches release.

## Rationale
- Per-epic teams scope agent communication to relevant participants
- Cleanup on release prevents accumulation of stale teams
- Naming convention makes teams discoverable and correlatable to epics

## Source
state/design/2026-03-28-orchestrator.md
