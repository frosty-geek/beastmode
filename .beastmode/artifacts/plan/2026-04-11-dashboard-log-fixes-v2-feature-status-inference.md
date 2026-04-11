---
phase: plan
slug: 96e0e0
epic: dashboard-log-fixes-v2
feature: feature-status-inference
wave: 1
---

# Feature Status Inference

**Design:** .beastmode/artifacts/design/2026-04-11-96e0e0.md

## User Stories

2. As a pipeline operator, I want dispatched features to show [in-progress] instead of [pending], so that the tree accurately reflects what's running.

## What to Build

The `buildTreeState()` function seeds feature nodes from the enriched epic store skeleton, which carries the persisted status (always "pending" at dispatch time). When session entries are subsequently attached to these skeleton-seeded feature nodes, the status is never upgraded — the feature continues to display as [pending] even though it has an active session.

Fix `buildTreeState()` so that when session entries are attached to a skeleton-seeded feature node whose status is "pending", the status is upgraded to "in-progress". This is a runtime-only display status — no store persistence change is needed.

The upgrade should only happen when entries are actually attached (non-empty entry list), and only when the current status is "pending". Features that are already "completed" or other terminal states should not be downgraded.

Update unit tests to verify that features with matching session entries get status "in-progress" even when skeleton-seeded as "pending", and that completed features are not downgraded.

## Integration Test Scenarios

<!-- No behavioral scenarios — skip gate classified this feature as non-behavioral -->

## Acceptance Criteria

- [ ] Skeleton-seeded features with session entries display as "in-progress"
- [ ] Features without session entries retain their skeleton status
- [ ] Completed features are not downgraded to "in-progress"
- [ ] Unit tests verify status upgrade logic
