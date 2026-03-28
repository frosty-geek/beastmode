## Context
Agent spawning needs to move from Claude Code native subagents to SDK-managed sessions for reliability and typed control. With cmux integration, a second dispatch path provides live terminal visibility.

## Decision
Extract a `DispatchedSession` interface with two implementations: `SdkSession` (SDK `query()` with `permissionMode: 'bypassPermissions'`) and `CmuxSession` (cmux terminal surface via JSON-RPC Unix socket). `SessionFactory` selects based on cmux availability and `cmux.enabled` config. Fan-out per feature at implement. CLI-owned worktrees provide isolation regardless of dispatch path. Completion detection uses `.beastmode-runs.json` for both session types.

## Rationale
Strategy pattern decouples dispatch mechanism from orchestration logic. SDK sessions provide typed streaming and cost tracking. cmux sessions provide live terminal visibility and interactive capability. The abstraction improves testability of the existing SDK path as a standalone benefit.

## Source
`.beastmode/state/design/2026-03-28-typescript-pipeline-orchestrator.md`
`.beastmode/state/design/2026-03-28-cmux-integration.md`
