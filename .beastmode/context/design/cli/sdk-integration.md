## Context
Phase execution needs typed session management, streaming output, cost tracking, and clean cancellation. With cmux integration, a second dispatch mechanism requires abstraction.

## Decision
Extract `DispatchedSession` interface with `SdkSession` and `CmuxSession` implementations. `SdkSession` uses `@anthropic-ai/claude-agent-sdk` with `query()` invocation, `settingSources: ['project']`, `permissionMode: 'bypassPermissions'`, and AbortController for cancellation. `CmuxSession` communicates via JSON-RPC over `/tmp/cmux.sock`, creates terminal surfaces, and sends commands via `surface.send-text`. `SessionFactory` reads config and runtime state to return the appropriate type. Design phase always uses `Bun.spawn` for interactive stdio, bypassing the factory.

## Rationale
Strategy pattern decouples dispatch from orchestration. SDK sessions provide typed streaming and programmatic control. cmux sessions provide live terminal visibility and interactive capability (agents can prompt for input at human gates). The abstraction improves testability regardless of cmux.

## Source
`.beastmode/state/design/2026-03-28-typescript-pipeline-orchestrator.md`
`.beastmode/state/design/2026-03-28-cmux-integration.md`
