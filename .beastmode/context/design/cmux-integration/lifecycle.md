## Context
cmux surfaces must be created and destroyed in sync with the agent lifecycle to prevent stale terminals from accumulating.

## Decision
Clean up cmux workspace and all surfaces when an epic reaches release. Cleanup timing controlled by `cmux.cleanup` config (on-release/manual/immediate). On startup, reconcile existing workspaces: adopt live surfaces into DispatchTracker, close dead surfaces, remove empty workspaces.

## Rationale
Release cleanup mirrors the git worktree lifecycle (created at dispatch, destroyed at release). Startup reconciliation prevents double-dispatch when the watch loop restarts while agents are still running.

## Source
`.beastmode/state/design/2026-03-28-cmux-integration.md`
