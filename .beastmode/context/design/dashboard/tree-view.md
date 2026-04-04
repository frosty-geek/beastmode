# Tree View

## Context
The dashboard and watch command both rendered flat log output. The dashboard used ring buffers with a message mapper, and the watch command used a flat logger subscriber. Multi-epic output was hard to parse with hierarchy encoded only in scope columns.

## Decision
A shared `<TreeView />` Ink component renders pipeline output as a hierarchical tree: epic > phase > feature, with vertical line connectors (`|`, `| |`, `| | .`). Tree state is managed by a `useTreeState` React hook shared between watch and dashboard. The watch command uses `TreeLogger` (a Logger interface wrapper that routes messages to tree state). The dashboard uses a `useDashboardTreeState` adapter that transforms its existing `MergedLogEntry[]` + session events into tree state. Phase coloring follows the shared PHASE_COLORS map from the monokai-palette module — Monokai Pro hex values, centralized to eliminate duplicate definitions. Full scrollback in watch mode (normal terminal buffer, not alternate screen). Dashboard TreeView works within Ink fullscreen mode with tree trimming for auto-follow. `--plain` flag and non-TTY detection fall back to the existing flat format.

## Rationale
Shared component ensures consistent visual language. Logger interface injection means the pipeline runner is unchanged — it calls `logger.log()` as before. Adapter pattern for dashboard preserves the existing data flow (ring buffers, session events) while swapping only the rendering layer. Normal terminal buffer for watch preserves scrollback history.

## Source
.beastmode/artifacts/design/2026-04-04-tree-log-view.md
.beastmode/artifacts/implement/2026-04-04-tree-log-view-tree-view-component.md
.beastmode/artifacts/implement/2026-04-04-tree-log-view-dashboard-adoption.md
