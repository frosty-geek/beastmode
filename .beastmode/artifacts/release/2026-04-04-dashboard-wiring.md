---
phase: release
slug: dashboard-wiring
epic: dashboard-wiring
bump: minor
---

# Release: dashboard-wiring

**Version:** v0.77.0
**Date:** 2026-04-04

## Highlights

Replaces the legacy drill-down navigation model with a three-panel layout (EpicsPanel, DetailsPanel, LogPanel) wired through shared context, deletes all obsolete components and hooks, and adds a comprehensive integration test suite validating the full wiring.

## Features

- Rewrite App.tsx to use ThreePanelLayout with slot-based panel composition (7c86633)
- Delete legacy drill-down components: EpicTable, FeatureList, AgentLog, ActivityLog, CrumbBar, view-stack, and associated hooks (def226a)
- Clean up barrel exports and key hints for new panel architecture (7c2520b)
- Clean up test files for deleted components (79fd123)
- Add App wiring integration test with 22 tests and 56 assertions (b2b7456)

## Docs

- Rewrite DESIGN.md Dashboard section for three-panel model (9bbbc09)
- Fix L3 dashboard.md consistency with L2 rewrite (9ffa4b1)

## Full Changelog

```
3ae2cb0 validate(dashboard-wiring): checkpoint
6a8b823 implement(dashboard-wiring-integration-test): checkpoint
b2b7456 feat(integration-test): add App wiring integration test
33d6945 implement(dashboard-wiring-context-update): checkpoint
9ffa4b1 docs(dashboard-wiring): fix L3 dashboard.md consistency with L2 rewrite
9bbbc09 docs(dashboard-wiring): rewrite DESIGN.md Dashboard section for three-panel model
2ab91cb implement(dashboard-wiring-app-rewrite): checkpoint
79fd123 feat(app-rewrite): clean up test files for deleted components
7c2520b feat(app-rewrite): clean up barrel exports and key hints
def226a feat(app-rewrite): delete legacy drill-down components and hooks
7c86633 feat(app-rewrite): rewrite App.tsx to use ThreePanelLayout
1c32f58 plan(dashboard-wiring): checkpoint
a3f2bdf design(dashboard-wiring): checkpoint
240661f design(dashboard-wiring): checkpoint
```
