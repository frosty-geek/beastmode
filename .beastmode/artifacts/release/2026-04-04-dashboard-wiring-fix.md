---
phase: release
slug: dashboard-wiring-fix
epic: dashboard-wiring-fix
bump: minor
---

# Release: dashboard-wiring-fix

**Version:** v0.82.0
**Date:** 2026-04-04

## Highlights

Wires ThreePanelLayout into the dashboard App.tsx, replacing the dead TwoColumnLayout. Adds full Cucumber integration test coverage for dashboard wiring scenarios.

## Features

- Wire ThreePanelLayout into App.tsx as the primary dashboard layout
- Add dashboard cucumber profile and wire integration tests
- Add dashboard wiring step definitions
- Add DashboardWorld and hooks for integration testing
- Add dashboard wiring Gherkin scenarios

## Chores

- Delete dead TwoColumnLayout and its tests

## Full Changelog

```
a92634e design(dashboard-wiring-fix): checkpoint
110fa9c design(dashboard-wiring-fix): checkpoint
ee8394f plan(dashboard-wiring-fix): checkpoint
b3549e0 feat(integration-tests): add dashboard wiring Gherkin scenarios
8072a99 feat(integration-tests): add DashboardWorld and hooks
3a7ec43 feat(integration-tests): add dashboard wiring step definitions
f116eed feat(integration-tests): add dashboard cucumber profile and wire tests
4b35245 implement(dashboard-wiring-fix-integration-tests): checkpoint
a4c4871 feat(dashboard): wire ThreePanelLayout into App.tsx
d17ffaa chore(dashboard): delete dead TwoColumnLayout and its tests
5330769 implement(dashboard-wiring-fix-wire-three-panel-layout): checkpoint
63f502e validate(dashboard-wiring-fix): checkpoint
```
