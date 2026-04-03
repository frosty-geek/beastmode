---
phase: plan
slug: tree-log-view
epic: tree-log-view
feature: tree-state-engine
wave: 1
---

# Tree State Engine

**Design:** `.beastmode/artifacts/design/2026-04-04-tree-log-view.md`

## User Stories

1. As a developer running `beastmode watch`, I want to see pipeline output as a hierarchical tree grouped by epic, so that I can instantly identify which messages belong to which epic without parsing scope columns.
2. As a developer watching multiple concurrent epics, I want each epic's output grouped together (not interleaved), so that I can follow one epic's progress without noise from others.
5. As a developer, I want runner lifecycle messages (worktree prep, rebase, reconcile, GitHub sync) to appear as leaf nodes in the tree under the appropriate phase, so that all pipeline activity is captured in the hierarchy.
6. As a developer, I want system-level messages (startup, shutdown, strategy selection) to render flat without tree prefix, so that pipeline chrome doesn't get confused with epic-scoped work.
9. As a developer, I want the tree view to auto-derive phase boundaries from session events (session-started with a new phase auto-closes the prior phase node), so that no new WatchLoop events are needed.
12. As a developer, I want duration information to remain in message text (e.g., "completed (202s)"), so that timing is preserved without adding new columns or annotations.

## What to Build

A `TreeLogger` class that implements the existing `Logger` interface and maintains a hierarchical tree state representing the pipeline execution. The tree has three levels: epic > phase > feature.

**TreeLogger class:**
- Implements `Logger` (log, detail, debug, trace, warn, error, child)
- Accepts a verbosity level and an optional `LogContext` (same as `createLogger`)
- Instead of writing to stdout, pushes structured tree node entries into a reactive state store
- The `child()` method creates a new TreeLogger scoped to a deeper context (epic, phase, feature)
- System-level messages (no epic in context) are stored as flat root-level entries
- Messages with epic context are placed under the appropriate epic node, creating it if needed
- Messages with phase context are placed under the epic > phase node
- Messages with feature context are placed under epic > phase > feature

**Tree state model:**
- A `TreeState` type representing the full tree: ordered list of epic nodes, each containing phase nodes, each containing feature nodes, each containing leaf message entries
- Each node has: id, label, type (epic/phase/feature/system), children, and a list of log entries
- Entries preserve: timestamp, level, message text, and the original LogContext
- Epic ordering follows insertion order (first-seen = first-rendered)

**Phase auto-derivation:**
- When a `session-started` WatchLoop event fires for an epic with a new phase, the TreeLogger (or a companion function that the watch integration calls) opens a new phase node under the epic
- When `session-completed` fires, the phase node is marked as closed (but remains in the tree for scrollback)
- No new WatchLoop events needed — the existing event map is sufficient

**Shared state hook:**
- A `useTreeState()` React hook that wraps the tree state model for Ink consumption
- Exposes: the current tree, and mutation methods (addEntry, openPhase, closePhase, openFeature, closeFeature)
- The hook and the TreeLogger share the same underlying state model type so the TreeView component works with either

**Format function:**
- A `formatTreeLogLine` function that produces simplified log lines for tree mode: `[HH:MM:SS] LEVEL  message` (no phase column, no scope column — the tree structure conveys that)
- Warn/error lines still get level-specific treatment

## Acceptance Criteria

- [ ] TreeLogger implements the Logger interface and can be used as a drop-in replacement for createLogger
- [ ] Messages routed to correct tree depth based on LogContext (system=root, epic=L1, phase=L2, feature=L3)
- [ ] Multi-epic state maintained — each epic has its own subtree
- [ ] Phase auto-derivation: new phase for same epic auto-opens new phase node
- [ ] System messages (no epic context) stored as flat root entries
- [ ] useTreeState hook provides reactive access to tree state for Ink components
- [ ] formatTreeLogLine produces simplified output without scope/phase columns
- [ ] Duration text in messages passes through unchanged
- [ ] Unit tests for TreeLogger routing, phase auto-derivation, and multi-epic grouping
