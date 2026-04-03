---
phase: plan
slug: tree-log-view
epic: tree-log-view
feature: tree-view-component
wave: 1
---

# Tree View Component

**Design:** `.beastmode/artifacts/design/2026-04-04-tree-log-view.md`

## User Stories

3. As a developer, I want phase nodes (plan, implement, validate, release) indented under their epic with phase-specific coloring (blue/yellow/cyan/green), so that I can visually distinguish pipeline stages.
4. As a developer, I want feature nodes (write-plan, agent-review, etc.) indented under their phase with `│ │ ·` connectors, so that implement fan-out is visually nested.
7. As a developer, I want the tree view to show full scrollback of all messages, so that I can review the complete pipeline history during a long run.
11. As a developer, I want the current `(scope)` and fixed-width `phase` columns dropped from tree-mode output, so that the tree structure replaces redundant metadata and message lines have more horizontal space.

## What to Build

An Ink `<TreeView />` React component that renders the tree state as a terminal UI with vertical line connectors and phase-based coloring.

**TreeView component:**
- Accepts the tree state (from `useTreeState` or equivalent) as props
- Renders each epic as a top-level node with its label
- Under each epic, renders phase nodes indented with `│` vertical connector
- Under each phase, renders feature nodes indented with `│ │` double connector
- Leaf messages (log entries) are rendered with bullet markers: `│ ·` (under phase) or `│ │ ·` (under feature)
- System-level messages render flat (no tree prefix)

**Connector rendering:**
- Epic level: no prefix (top-level)
- Phase level: `│ ` prefix
- Feature level: `│ │ ` prefix
- Leaf under phase: `│ · ` prefix
- Leaf under feature: `│ │ · ` prefix
- Last-child handling: use `└` for the final sibling at each level (optional refinement)

**Phase coloring:**
- Reuse the existing PHASE_COLOR map: design=magenta, plan=blue, implement=yellow, validate=cyan, release=green, done=dim green, cancelled=red
- Phase node labels are colored according to the phase
- Leaf messages under a phase inherit that phase's color for the tree connector lines
- Warn/error lines override with yellow/red full-line coloring (same as current behavior)

**Log line format in tree mode:**
- Each leaf entry renders as: `[tree-prefix] [HH:MM:SS] LEVEL  message`
- No scope column `(epic/feature)` — the tree position conveys this
- No phase column — the parent node conveys this
- Timestamp and level remain for grep-ability

**Full scrollback:**
- The component renders ALL entries (no ring buffer, no truncation)
- Normal terminal buffer (not alternate screen) so that terminal scrollback works after Ctrl+C
- The Ink app should use `{fullScreen: false}` or equivalent to stay in the normal buffer

## Acceptance Criteria

- [ ] TreeView renders epic > phase > feature hierarchy with `│ ·` connectors
- [ ] Phase nodes colored using PHASE_COLOR map (blue for plan, yellow for implement, etc.)
- [ ] Feature nodes nested under their phase with double-depth connectors
- [ ] System messages render flat (no tree prefix)
- [ ] Scope and phase columns omitted from tree-mode leaf lines
- [ ] Full scrollback — all entries rendered, no truncation
- [ ] Warn/error lines get yellow/red full-line treatment
- [ ] Snapshot tests validate tree rendering for known state inputs
