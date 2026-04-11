---
phase: plan
slug: 96e0e0
epic: dashboard-log-fixes-v2
feature: system-routing
wave: 1
---

# System Routing

**Design:** .beastmode/artifacts/design/2026-04-11-96e0e0.md

## User Stories

1. As a pipeline operator, I want SYSTEM to only show watch loop lifecycle events (session start/complete/dead, global errors), so that epic-scoped logs don't pollute the system view.

## What to Build

The DashboardSink's `write()` method currently pushes every log entry to `systemRef.entries` unconditionally, regardless of whether the entry has epic context. This causes epic-scoped logs (phase dispatches, feature progress, etc.) to bleed into the SYSTEM tree node alongside watch loop lifecycle events.

Fix the routing logic in `DashboardSink.write()` so that entries with `context.epic` present are excluded from `systemRef.entries`. Only entries without epic context — watch loop lifecycle events, global errors, session start/complete/dead — should appear under SYSTEM.

The FallbackEntryStore routing (entries WITH epic context) is already correct and should not change.

Update unit tests to verify that entries with `context.epic` are NOT pushed to `systemRef.entries`, and that entries without epic context still are.

## Integration Test Scenarios

<!-- No behavioral scenarios — skip gate classified this feature as non-behavioral -->

## Acceptance Criteria

- [ ] Entries with `context.epic` are not pushed to `systemRef.entries`
- [ ] Entries without `context.epic` are still pushed to `systemRef.entries`
- [ ] FallbackEntryStore routing is unchanged
- [ ] Unit tests verify the routing filter
