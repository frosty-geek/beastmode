---
phase: release
slug: dashboard-extensions
epic: dashboard-extensions
bump: minor
---

# Release: dashboard-extensions

**Version:** v0.95.0
**Date:** 2026-04-05

## Highlights

Adds interactive dashboard extensions: tree hierarchy refactoring (CLI > Epic > Feature), epics tree panel with flat row model, details panel with selection-driven content, keyboard extensions (focus, filters, scroll), animated focus border, and full three-panel wiring into App.tsx.

## Features

- feat(tree-refactor): refactor tree types — remove PhaseNode, add CliNode, flatten hierarchy
- feat(tree-refactor): update tree-format depths — CLI > Epic > Feature, add phase badge
- feat(tree-refactor): extend isDim to cover blocked and pending statuses
- feat(tree-refactor): refactor buildTreeState — store-seeded skeleton with slug-matched entry attachment
- feat(tree-refactor): restore flat types + update log-panel tests
- feat(tree-refactor): update LogPanel, TreeView, use-dashboard-tree-state for flat types
- feat(tree-refactor): update LogPanel pure functions for flat CLI > Epic > Feature structure
- feat(epics-tree): add flat row model with buildFlatRows and rowSlugAtIndex
- feat(epics-tree): add feature status color map and dim function
- feat(epics-tree): wire EpicsPanel to flat row model with feature rendering
- feat(epics-tree): wire expansion state, Enter toggle, and row-model itemCount
- feat(details-panel): add selection type and content resolver
- feat(details-panel): add DetailsPanel component
- feat(details-panel): add scroll offset to keyboard hook
- feat(details-panel): rename OVERVIEW to DETAILS and add integration test
- feat(keyboard-extensions): add focus panel, phase filter, and blocked toggle
- feat(keyboard-extensions): add scroll clamping and Wave 2 tests
- feat(dashboard-wiring): add keyboard state fields for focus, filters, scroll
- feat(dashboard-wiring): ThreePanelLayout focus border and DETAILS title
- feat(dashboard-wiring): add phase/blocked filters and scroll rendering to LogPanel
- feat(dashboard-wiring): wire filters, scroll, and focus into App.tsx
- feat(focus-border): animated nyan border on focused panel with Tab switching

## Fixes

- fix(details-panel): add missing keyboard hook props and fix type error

## Chores

- design(dashboard-extensions): checkpoint
- plan(dashboard-extensions): checkpoint
- validate(dashboard-extensions): checkpoint
- implement checkpoints (tree-refactor, keyboard-extensions, focus-border, epics-tree, details-panel, dashboard-wiring)

## Full Changelog

v0.94.0...feature/dashboard-extensions (36 commits)
