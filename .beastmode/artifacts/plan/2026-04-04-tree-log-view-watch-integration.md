---
phase: plan
slug: tree-log-view
epic: tree-log-view
feature: watch-integration
wave: 2
---

# Watch Integration

**Design:** `.beastmode/artifacts/design/2026-04-04-tree-log-view.md`

## User Stories

8. As a developer piping `beastmode watch` output to a file or non-TTY, I want flat log output (no tree, no ANSI), so that logs remain grep-friendly and parseable.
13. As a developer, I want `--plain` to force flat log output even on a TTY, so that I can opt out of the tree view when needed.

## What to Build

Wire the TreeLogger and TreeView into the `beastmode watch` command, with TTY detection and a `--plain` flag for opting out.

**Watch command changes:**
- Add `--plain` flag parsing to the watch command argument handling
- TTY detection: check `process.stdout.isTTY` to decide between tree and flat mode
- When tree mode is active (TTY and no `--plain`):
  - Create a `TreeLogger` instead of `createLogger` for the watch loop
  - Mount an Ink app with `<TreeView />` that subscribes to the tree state
  - Wire WatchLoop events (session-started, session-completed, error, etc.) to TreeLogger state mutations (open/close phase nodes, open/close feature nodes)
  - The Ink app runs in normal buffer mode (not alternate screen) for full scrollback
- When flat mode is active (non-TTY or `--plain`):
  - Use the existing `createLogger` + `attachLoggerSubscriber` path unchanged

**Event-to-tree wiring:**
- `session-started` → open a phase node (or feature node if featureSlug present) in the tree state
- `session-completed` → mark the phase/feature node as closed, log the completion message
- `error` → add error entry to the appropriate epic subtree
- `release:held` → add info entry to the waiting epic's subtree
- `started` / `stopped` → add as system-level (flat) entries
- SDK session `entry` events → pipe to TreeLogger for real-time message streaming under the active feature/phase node

**Signal handling:**
- Ink handles SIGINT for the tree view (same as dashboard)
- On shutdown, call `loop.stop()` and unmount the Ink app

## Acceptance Criteria

- [ ] `beastmode watch` renders tree view by default on TTY
- [ ] `beastmode watch --plain` forces flat output on TTY
- [ ] Non-TTY stdout automatically uses flat output
- [ ] WatchLoop events correctly mapped to tree state mutations
- [ ] SDK session streaming entries appear as live leaf nodes in the tree
- [ ] Ctrl+C gracefully shuts down Ink app and watch loop
- [ ] Full scrollback preserved (normal terminal buffer, not alternate screen)
- [ ] Integration test: `beastmode watch --plain` output matches existing flat format
