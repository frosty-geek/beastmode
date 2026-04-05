---
phase: plan
slug: spring-cleaning
epic: spring-cleaning
feature: dispatch-simplify
wave: 2
---

# Dispatch Simplify

**Design:** `.beastmode/artifacts/design/2026-04-05-spring-cleaning.md`

## User Stories

1. As a developer, I want cmux dispatch code removed, so that the codebase only contains actively-used dispatch strategies.
2. As a developer, I want SDK dispatch logic (SdkSessionFactory, dispatchPhase, SDK streaming infrastructure) removed, so that dispatch is exclusively iTerm2-based.
4. As a developer, I want the `dispatch-strategy` config key and `cmux` config section removed, so that configuration reflects the actual capability set.
5. As a developer, I want SDK streaming types (RingBuffer, SessionEmitter, LogEntry, SdkContentBlock) removed from factory.ts, so that the dispatch module only contains iTerm2-relevant abstractions.
6. As a developer, I want DispatchedSession and SessionHandle types stripped of the `events` field, so that session types reflect iTerm2-only dispatch.

## What to Build

**Delete entire files:**
- `dispatch/cmux.ts` — cmux client and session factory
- `pipeline/startup.ts` — 100% cmux reconciliation code

**Strip from `dispatch/factory.ts`:**
- Delete `SdkSessionFactory` class
- Delete SDK message types: `SdkTextBlock`, `SdkToolUseBlock`, `SdkToolResultBlock`, `SdkContentBlock`
- Delete `RingBuffer` class
- Delete `SessionEmitter` class
- Delete `SessionStreamEvents` interface
- Delete `LogEntry` interface — BUT first check dashboard consumers. `LogEntry` is used by `lifecycle-entries.ts` and `dashboard-logger.ts`. If those consumers can be refactored to use a simpler type inline, delete it. If not, preserve `LogEntry` as a standalone type (it's used for lifecycle entries, not SDK streaming).
- Strip `events?: SessionEmitter` from `SessionHandle`
- Preserve `SessionFactory` interface, `SessionCreateOpts`, `runInteractive()`, `InteractiveRunnerOptions`

**Decision on LogEntry:** The PRD says "SDK streaming types removed from factory.ts." LogEntry is technically an SDK streaming type but is reused by the dashboard lifecycle system. The design decision says "LogEntry" in the removal list but lifecycle-entries.ts and dashboard-logger.ts both import it. The clean approach: keep `LogEntry` in factory.ts since it's a simple structural type still actively consumed. Strip only the SDK-specific types that have zero non-SDK consumers.

**Strip from `dispatch/types.ts`:**
- Remove `events?: SessionEmitter` field from `DispatchedSession`
- Remove `import type { SessionEmitter } from "./factory.js"` import
- Preserve all other fields (`tty`, `abortController`, `promise`, etc.)

**Simplify `config.ts`:**
- Remove `DispatchStrategy` type entirely
- Remove `dispatch-strategy` key from `CliConfig` interface
- Remove `dispatch-strategy` default from `DEFAULT_CONFIG`
- Remove `dispatch-strategy` parsing from `loadConfig()`

**Simplify `pipeline/runner.ts`:**
- Narrow `DispatchStrategy` type to `"interactive" | "iterm2"` (remove `"sdk"` and `"cmux"`)

**Update dashboard consumers:**
- `dashboard/hooks/use-dashboard-tree-state.ts` — remove `SessionEmitter` import, remove the `useEffect` that subscribes to `session.events`, remove fallback-vs-SDK branching (all entries now come from fallback store)
- `dashboard/lifecycle-entries.ts` — keep as-is (uses `LogEntry` type, no SDK-specific code)
- `dashboard/dashboard-logger.ts` — keep as-is (uses `LogEntry` type)

## Acceptance Criteria

- [ ] `dispatch/cmux.ts` deleted
- [ ] `pipeline/startup.ts` deleted
- [ ] `SdkSessionFactory`, `RingBuffer`, `SessionEmitter`, `SessionStreamEvents`, SDK content block types deleted from `factory.ts`
- [ ] `LogEntry` preserved in `factory.ts` (dashboard lifecycle consumers depend on it)
- [ ] `events` field removed from `SessionHandle` and `DispatchedSession`
- [ ] `DispatchStrategy` type and `dispatch-strategy` config key removed from `config.ts`
- [ ] `pipeline/runner.ts` `DispatchStrategy` narrowed to `"interactive" | "iterm2"`
- [ ] `use-dashboard-tree-state.ts` no longer references `SessionEmitter` or `session.events`
- [ ] All imports of deleted modules produce compile errors (no phantom re-exports)
- [ ] `bun run build` succeeds (TypeScript compilation clean)
