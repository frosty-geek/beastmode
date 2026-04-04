---
phase: release
slug: dashboard-polish
epic: dashboard-polish
bump: minor
---

# Release: dashboard-polish

**Bump:** minor
**Date:** 2026-04-05

## Highlights

Complete visual overhaul of the dashboard: Monokai Pro color palette, 256-step smooth gradient banner, depth-based panel hierarchy, vertical split layout with chrome removal, and banner text fixes. Full integration test coverage via Cucumber scenarios.

## Features

- Centralized Monokai Pro color module with hex/ANSI palette
- 256-step smooth gradient interpolation replacing 6-color banner palette
- Depth hierarchy panel backgrounds and chrome header/hints bars
- Vertical split layout with outer chrome removed
- Panel interior background colors via PanelBox
- DEPTH background constants in monokai-palette
- Integration test cucumber profile, scenarios, step definitions, and world helpers for all dashboard-polish features

## Fixes

- Correct banner trailing dot count to 15
- Correct banner D/K character swap with trailing dots
- Add polish steps to dashboard profile for modified integration scenarios

## Chores

- Refactor status.ts, PanelBox, ThreePanelLayout, tree-format, OverviewPanel, EpicsPanel to use shared Monokai palette
- Update test assertions for 24-bit ANSI colors and Monokai hex values
- Remove unused BG constant, keep DEPTH

## Full Changelog

- `daa6f3c..84edcda` — 34 commits across design, plan, implement, validate phases
