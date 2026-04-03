---
phase: release
slug: tree-log-view
epic: tree-log-view
bump: minor
---

# Release: tree-log-view

**Bump:** minor
**Date:** 2026-04-04

## Highlights

Adds a hierarchical tree log view to the dashboard and watch mode, replacing flat log output with structured, collapsible tree rendering that reflects epic/feature/phase/task nesting.

## Features

- Tree data types and format functions with tests
- `formatTreeLogLine` for simplified tree output
- `TreeView` Ink component with snapshot tests
- Tree state type definitions and model with mutations and tests
- `TreeLogger` class with routing and tests
- `useTreeState` React hook with integration tests
- Barrel export for tree-view module
- Tree state adapter for recursive-to-flat conversion
- `attachTreeSubscriber` for WatchLoop-to-tree wiring
- `WatchTreeApp` Ink component for watch mode
- `--plain` flag and TTY-based tree/flat mode switching
- `useDashboardTreeState` adapter hook
- Replace `LogPanel` flat rendering with `TreeView` in dashboard
- Wire `useDashboardTreeState` adapter in `App.tsx`

## Fixes

- Remove duplicate tree-view files
- Remove unused React import in tree-view
- Remove unused type imports in tree-state-engine tests
- Restore `format.ts` and add to barrel export
- Replace Box overflow with tree trimming for auto-follow
- Remove unused imports and parameters in watch-integration
- Use top-level `DispatchedSession` import in `App.tsx`
- Remove `"held"` case not present in `DashboardEvent["type"]` union
- Remove unused `PhaseNode` and `FeatureNode` imports

## Chores

- Add `ink-testing-library` dev dependency
- Remove duplicate tree-view files

## Full Changelog

```
b002be3 design(tree-log-view): checkpoint
4b4f50a design(tree-log-view): checkpoint
e809db3 plan(tree-log-view): checkpoint
cb852b6 feat(tree-view): add tree data types
0bf624a feat(tree-view): add tree format functions with tests
47a1582 feat(tree-state-engine): add tree state type definitions
1e6933b feat(tree-state-engine): add formatTreeLogLine for simplified tree output
8d80a78 chore: add ink-testing-library dev dependency
8cd8909 feat(tree-view): add TreeView Ink component with snapshot tests
e4742f0 fix(tree-view): remove unused React import
f92373e chore: remove duplicate tree-view files
f8f309d implement(tree-log-view-tree-view-component): checkpoint
b3cb9b7 feat(tree-state-engine): implement tree state model with mutations and tests
aaded9b feat(tree-state-engine): implement TreeLogger class with routing and tests
bbecab4 feat(tree-state-engine): add useTreeState React hook with integration tests
2a38e1f feat(tree-state-engine): add barrel export for tree-view module
33bebd1 fix(tree-state-engine): restore format.ts and add to barrel export
2d7e974 fix(tree-state-engine): remove unused type imports in tests
987e07e implement(tree-log-view-tree-state-engine): checkpoint
794d064 feat(dashboard-adoption): add useDashboardTreeState adapter hook
721d5b2 feat(watch-integration): add TreeState adapter for recursive-to-flat conversion
1ee35c6 feat(watch-integration): add attachTreeSubscriber for WatchLoop-to-tree wiring
d00874a feat(dashboard-adoption): replace LogPanel flat rendering with TreeView
d7e7783 feat(watch-integration): add WatchTreeApp Ink component
e6c40b7 fix(dashboard-adoption): replace Box overflow with tree trimming for auto-follow
17035c2 feat(watch-integration): add --plain flag and TTY-based tree/flat mode switching
32790ff fix(watch-integration): remove unused imports and parameters
4b0b2ff implement(tree-log-view-watch-integration): checkpoint
d584d69 feat(dashboard-adoption): wire useDashboardTreeState adapter in App.tsx
1fd8634 fix(dashboard-adoption): use top-level DispatchedSession import in App.tsx
a475647 implement(tree-log-view-dashboard-adoption): checkpoint
22bad44 validate(tree-log-view): checkpoint
```
