---
phase: design
slug: dashboard-extensions
epic: dashboard-extensions
---

## Problem Statement

The dashboard log panel is a flat, non-interactive tail view — it auto-trims to the last 50 lines, cannot be scrolled, doesn't show the full epic/feature tree skeleton, and hides blocked or upcoming work entirely. The details panel (currently "Overview") shows static summary info regardless of what's selected, missing the opportunity to surface PRD and plan artifacts in context. Phase information clutters the tree hierarchy instead of being a filterable dimension.

## Solution

Overhaul the dashboard into a scrollable, store-seeded hierarchical log (CLI > Epic > Feature), expand the epics panel into a collapsible tree with per-epic feature drill-down, and transform the overview panel into a context-sensitive "Details" panel that displays PRD artifacts for selected epics and plan artifacts for selected features. Add Tab-based focus management with animated nyan-banner-colored borders, phase/blocked/verbosity filters, and PgUp/PgDn scrolling for the Details panel.

## User Stories

1. As a user, I want the log tree to show a CLI root node containing system-level entries (watch loop start/stop, scan events, errors), so that system messages have proper hierarchy instead of rendering flat.

2. As a user, I want the log tree to show all epics and features from the store as a skeleton, including blocked and upcoming ones (dimmed with status visible), so that I can see the full pipeline state at a glance.

3. As a user, I want active epics and features in the log tree to show a spinner indicator, so that I can immediately identify what's currently running.

4. As a user, I want the log tree hierarchy to be CLI > Epic > Feature (no phase level), with phase displayed as a label on each entry, so that the tree is shallower and easier to scan.

5. As a user, I want to press 'p' to cycle a phase filter (all > design > plan > implement > validate > release), so that I can focus the log on a specific phase without cluttering the tree hierarchy.

6. As a user, I want selecting an epic in the epics panel to filter the log tree to that epic's entries only, and "(all)" to show the full unfiltered tree, so that I can focus on one epic's activity.

7. As a user, I want the log panel to be scrollable — auto-following new entries by default, with manual scroll when I Tab into the log panel and use arrow keys, and 'G'/End to resume auto-follow, so that I can review history without losing real-time updates.

8. As a user, I want Tab to switch focus between the Epics panel and the Log panel, with the focused panel's border animating in sync with the nyan banner's leftmost color position, so that focus state is visually obvious and distinctive.

9. As a user, I want the epics panel to expand into a tree when I select an epic — showing its child features as indented rows that become selectable — with single-expand behavior (selecting a different epic collapses the previous one), so that I can drill into features without leaving the epics view.

10. As a user, I want the Overview panel renamed to "Details" and showing context-sensitive content: overview info when "(all)" is selected, the PRD artifact when an epic is selected, and the plan artifact when a feature is selected — all scrollable via PgUp/PgDn, so that I can read artifacts in context.

11. As a user, I want to press 'b' to toggle visibility of blocked items in the log tree, so that I can declutter the view when I only care about active work.

12. As a user, I want log entries at all levels (info, debug, warn, error) stored and displayed, with 'v' cycling verbosity to filter them, and warn/error always visible, so that I can control log detail without losing important messages.

## Implementation Decisions

- **Log tree hierarchy**: Flatten from Epic > Phase > Feature to CLI > Epic > Feature. The CLI node is a synthetic root holding system entries. Phase is removed as a tree level and instead displayed as a colored label/badge on each leaf entry.
- **Store-driven tree skeleton**: The log tree is seeded from the store's `listEnrichedFromStore()` data, creating nodes for all epics and their features regardless of whether they have log entries. Blocked/upcoming nodes render dimmed with their status badge. Active nodes show a spinner.
- **Phase filter**: New 'p' key cycles through `all | design | plan | implement | validate | release`. When a phase is selected, only entries tagged with that phase are shown. The current phase filter state is displayed in the key hints bar.
- **Blocked filter**: New 'b' key toggles visibility of blocked epic/feature nodes in the log tree. When hidden, blocked nodes and their entries are removed from the rendered tree.
- **Log scrolling**: Remove the 50-line `trimTreeToTail` limit. Keep all entries in memory for the session lifetime. Auto-follow (tail) is the default. When the log panel is focused and the user scrolls up, auto-follow pauses. 'G' or End resumes auto-follow.
- **Focus management**: Tab cycles between Epics panel and Log panel (two focusable panels). When focused, arrow keys drive that panel's navigation/scrolling. The focused panel's border color is set to the nyan banner's current leftmost character color, animating in sync with the banner's 80ms tick and 256-step gradient.
- **Epics tree expansion**: Selecting an epic (Enter or arrow into it) expands to show its child features as indented rows. Only one epic expanded at a time — selecting a different epic collapses the previous. Features in the expanded tree are selectable via arrow keys.
- **Details panel**: Renamed from "OVERVIEW" to "DETAILS". Content is context-sensitive: (all) selection shows the existing overview info (phase distribution, sessions, git status); epic selection reads the PRD artifact via `resolveArtifactPath(projectRoot, "design", epicSlug)` and renders the markdown; feature selection reads the plan artifact via `resolveArtifactPath(projectRoot, "plan", epicSlug)` and renders the feature's section. Content is scrollable via PgUp/PgDn regardless of which panel is Tab-focused.
- **Animated focus border**: The focused panel's border color tracks the nyan banner's color at position 0 of the interpolated 256-step palette, offset by the same `tickOffset` used in `NyanBanner`. This requires exposing the current tick offset (or computed color) via a shared ref or context so `PanelBox` can consume it.
- **Tree types refactor**: Remove `PhaseNode` from the tree type hierarchy. New structure: `TreeState { cli: CliNode; epics: EpicNode[] }` where `CliNode { entries: SystemEntry[] }` and `EpicNode { slug: string; status: string; features: FeatureNode[]; entries: TreeEntry[] }` and `FeatureNode { slug: string; status: string; entries: TreeEntry[] }`. Entries gain a `phase: string` field for the label and phase filter.
- **Entry phase label**: Each `TreeEntry` gains a `phase` field. The tree formatter renders it as a colored badge before the timestamp, using the existing Monokai phase color map.
- **Keyboard model update**: `use-dashboard-keyboard` gains `focusedPanel` state ('epics' | 'log'), Tab handler to cycle, 'p' for phase filter cycling, 'b' for blocked toggle. Arrow keys are routed to the focused panel. Existing keys ('q', '/', 'x', 'a', 'v') remain global (work regardless of focus).

## Testing Decisions

- Unit tests for the refactored tree types and tree building from store data — verify skeleton creation, entry attachment, phase label rendering
- Unit tests for new filters: phase filter function, blocked toggle filter function
- Unit tests for tree scrolling logic — auto-follow state, scroll offset tracking, resume on 'G'/End
- Visual smoke test: run `beastmode dashboard` with multiple epics in various phases and verify hierarchy, dimming, spinners, scrolling, filtering, and artifact display
- Prior art: existing `tree-format.test.ts` patterns for formatting tests, existing keyboard hook tests for navigation

## Out of Scope

- Changes to the WatchLoop, dispatch, or session infrastructure
- Changes to the NyanBanner animation engine (only consuming its color state)
- New keyboard shortcuts for panel resizing
- Vim-style keybindings (j/k) for navigation
- Color theme configuration
- Changes to `beastmode watch` or `beastmode status` — dashboard only
- Markdown rendering (PRD/plan shown as raw markdown text, not rendered rich text)

## Further Notes

- The artifact reader (`cli/src/artifacts/reader.ts`) already supports `resolveArtifactPath()` with glob fallback — no new reader infrastructure needed for loading PRDs and plans.
- The verbosity system (info/debug with warn/error always shown) is confirmed working. The dashboard sink stores all levels. The `shouldShowEntry()` function correctly gates by verbosity. The 'v' key cycles between info and debug.
- Log entries from both SDK sessions and lifecycle fallback entries are stored — both sources will populate the new tree.

## Deferred Ideas

- Vim-style keybindings (j/k/gg/G) as alternative navigation
- Panel resize with keyboard shortcuts
- Rich markdown rendering for PRD/plan display
- Collapsible epic nodes in the log tree (currently always expanded)
- Search within log entries (/ currently searches epic slugs)
