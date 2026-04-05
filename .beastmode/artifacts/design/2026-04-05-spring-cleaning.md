---
phase: design
slug: spring-cleaning
epic: spring-cleaning
---

## Problem Statement

The CLI carries three dispatch strategies (cmux, SDK, iTerm2) and three pipeline UIs (watch, status, dashboard) accumulated over rapid iteration. Only iTerm2 dispatch and the dashboard are actively used. The dead code increases maintenance surface, complicates onboarding, and creates false optionality in configuration.

## Solution

Remove cmux integration, SDK dispatch logic, and the status/watch CLI commands. Simplify to iTerm2-only dispatch with the dashboard as the sole pipeline UI. Keep the SessionFactory interface with one implementation for future extensibility.

## User Stories

1. As a developer, I want cmux dispatch code removed, so that the codebase only contains actively-used dispatch strategies.
2. As a developer, I want SDK dispatch logic (SdkSessionFactory, dispatchPhase, SDK streaming infrastructure) removed, so that dispatch is exclusively iTerm2-based.
3. As a developer, I want `beastmode watch` and `beastmode status` CLI commands removed, so that the dashboard is the sole pipeline UI entry point.
4. As a developer, I want the `dispatch-strategy` config key and `cmux` config section removed, so that configuration reflects the actual capability set.
5. As a developer, I want SDK streaming types (RingBuffer, SessionEmitter, LogEntry, SdkContentBlock) removed from factory.ts, so that the dispatch module only contains iTerm2-relevant abstractions.
6. As a developer, I want DispatchedSession and SessionHandle types stripped of the `events` field, so that session types reflect iTerm2-only dispatch.
7. As a developer, I want design docs, context tree entries, and L2/L3 knowledge updated to reflect the simplified architecture, so that project knowledge stays accurate.
8. As a developer, I want dead test files identified and removed on a case-by-case basis, so that the test suite only covers living code.

## Implementation Decisions

- **Dashboard stays** as the sole pipeline UI — it embeds its own watch loop
- **Watch loop (watch-loop.ts) stays** — dashboard depends on it
- **DispatchTracker stays** — watch loop depends on it
- **SessionFactory interface stays** in factory.ts with iTerm2 as sole implementation — preserves extensibility for future dispatch strategies
- **SdkSessionFactory deleted** from factory.ts — no SDK dispatch path
- **dispatchPhase() deleted** from watch.ts (file itself deleted)
- **selectStrategy() deleted** — no strategy selection needed, iTerm2 is implicit
- **ReconcilingFactory moves** from watch.ts to `dispatch/reconciling.ts` — dashboard is the sole consumer
- **startup.ts deleted** — 100% cmux reconciliation code, no other purpose
- **WatchTreeApp.tsx and watch-tree-subscriber.ts deleted** — orphaned by watch command removal
- **cmux.ts deleted** entirely
- **SDK streaming types removed** from factory.ts: RingBuffer, SessionEmitter, LogEntry, SdkTextBlock, SdkToolUseBlock, SdkToolResultBlock, SdkContentBlock, SessionStreamEvents
- **`events` field removed** from SessionHandle and DispatchedSession types
- **`tty` field preserved** on SessionHandle for iTerm2 sessions
- **DispatchStrategy type narrowed or removed** from config.ts — no config-driven selection
- **cmux config section removed** from BeastmodeConfig type and config.yaml
- **dispatch-strategy config key removed** from cli section
- **Dashboard wiring simplified** — directly instantiates ITermSessionFactory, no strategy selection
- **runInteractive() preserved** in factory.ts — used for manual `beastmode <phase>` CLI execution (design phase)
- **findProjectRoot() preserved** in dashboard.ts (already has its own copy)
- **Test files reviewed case-by-case** — delete tests for removed code, keep tests for surviving logic

## Testing Decisions

- Each test file reviewed individually: if it tests only deleted code, delete it; if it tests shared/surviving logic, keep it
- iTerm2 detection tests (iterm2-detect.test.ts) survive
- Watch-loop tests survive (dashboard depends on watch-loop)
- cmux tests (cmux-client.test.ts, cmux-session.test.ts) deleted
- SDK streaming tests (sdk-dispatch-streaming.test.ts, sdk-streaming.test.ts) deleted
- Strategy selection tests (iterm2-strategy.test.ts) likely deleted — strategy selection itself is removed
- status.test.ts deleted — status command removed
- watch.test.ts deleted — watch command removed
- reconcile-startup.test.ts deleted — startup.ts deleted
- Remaining test files assessed during implementation for transitive dependencies on deleted code

## Out of Scope

- Adding back SDK dispatch later (explicitly deferred)
- Modifying iTerm2 dispatch implementation (it2.ts changes only if needed for wiring cleanup)
- Dashboard UI changes (layout, components, styling untouched)
- Manifest or pipeline machine changes
- GitHub sync changes

## Further Notes

- The `strategy: "sdk"` string in ReconcilingFactory's runPipeline call should be updated or made generic since SDK is no longer the dispatch mechanism — the pipeline runner may need a minor type adjustment
- Dashboard components that read from SessionEmitter (log panel SDK streaming path) will fall back to lifecycle-only entries — this is already the behavior for non-SDK sessions

## Deferred Ideas

- Re-add SDK dispatch as a fallback strategy (user explicitly deferred)
- Headless watch mode for CI/server environments (removed with watch command)
- Status command replacement (dashboard is the sole UI now)
