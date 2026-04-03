---
phase: plan
slug: tree-log-view
epic: tree-log-view
feature: dashboard-adoption
wave: 2
---

# Dashboard Adoption

**Design:** `.beastmode/artifacts/design/2026-04-04-tree-log-view.md`

## User Stories

10. As a developer using `beastmode dashboard`, I want the dashboard's log panel to use the same tree component, so that the visual language is consistent across watch and dashboard.

## What to Build

Replace the dashboard's LogPanel internals with the shared `<TreeView />` component so that watch and dashboard use identical tree rendering.

**Dashboard log panel changes:**
- The existing `LogPanel` component receives `MergedLogEntry[]` from the `useLogEntries` hook
- Replace the flat entry rendering with `<TreeView />`, feeding the merged entries through the shared tree state model
- The `useLogEntries` hook already provides label (epic/feature slug), timestamp, text, and error detection — this maps to the tree state model's input
- The dashboard already subscribes to `session-started` and `session-completed` events in `App.tsx` — use these to drive tree state phase/feature open/close, same as the watch integration

**Adapter layer:**
- Build a thin adapter that transforms `MergedLogEntry[]` + dashboard events into tree state
- The adapter uses the same `useTreeState` hook but populates it from the dashboard's existing data sources (ring buffers + session events) rather than from a TreeLogger
- This keeps the dashboard's data flow unchanged — only the rendering layer swaps

**Constraints:**
- The dashboard uses alternate screen buffer — the TreeView must work correctly within Ink's fullscreen mode (bounded height, auto-follow newest entries)
- The dashboard's `maxVisibleLines` prop maps to a viewport window on the tree — show the last N rendered lines, not the last N entries (since tree entries span multiple lines with connectors)

## Acceptance Criteria

- [ ] Dashboard log panel renders using the shared `<TreeView />` component
- [ ] Tree hierarchy (epic > phase > feature) visible in the dashboard log panel
- [ ] Phase coloring consistent between watch and dashboard
- [ ] Existing dashboard data flow unchanged (useLogEntries hook still provides data)
- [ ] Auto-follow behavior preserved (newest entries visible at bottom)
- [ ] Dashboard alternate screen buffer compatible with TreeView rendering
