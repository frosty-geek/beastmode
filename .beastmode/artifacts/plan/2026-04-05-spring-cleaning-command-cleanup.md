---
phase: plan
slug: spring-cleaning
epic: spring-cleaning
feature: command-cleanup
wave: 3
---

# Command Cleanup

**Design:** `.beastmode/artifacts/design/2026-04-05-spring-cleaning.md`

## User Stories

3. As a developer, I want `beastmode watch` and `beastmode status` CLI commands removed, so that the dashboard is the sole pipeline UI entry point.

## What to Build

**Delete entire files:**
- `commands/watch.ts` — watch command, `dispatchPhase()`, `selectStrategy()`, `ReconcilingFactory`, `parseWatchArgs()`
- `commands/status.ts` — status command and all status display helpers
- `commands/WatchTreeApp.tsx` — Ink tree app for watch command's TUI mode
- `commands/watch-tree-subscriber.ts` — tree subscriber wiring for watch TUI

**Extract before deleting watch.ts:**
- Move `ReconcilingFactory` class to `dispatch/reconciling.ts` (new file) — dashboard.ts is the sole consumer
- The new file imports `SessionFactory`, `SessionCreateOpts`, `SessionHandle` from `dispatch/factory.ts` and `runPipeline` from `pipeline/runner.ts`
- Update the `strategy: "sdk"` string in `ReconcilingFactory.runPipeline()` call to `"iterm2"` since iTerm2 is now the sole dispatch mechanism

**Rewire `commands/dashboard.ts`:**
- Remove imports of `dispatchPhase`, `ReconcilingFactory`, `selectStrategy` from `./watch.js`
- Remove imports of `SdkSessionFactory` from `dispatch/factory.ts`
- Remove imports of `CmuxSessionFactory`, `CmuxClient` from `dispatch/cmux.js`
- Import `ReconcilingFactory` from `dispatch/reconciling.ts` (new location)
- Import `ITermSessionFactory`, `It2Client` from `dispatch/it2.ts`
- Replace the strategy selection block (if/else cmux/iterm2/sdk) with direct `ITermSessionFactory` instantiation
- The dashboard should create `new ITermSessionFactory(new It2Client())` directly, wrapped in `new ReconcilingFactory(factory, projectRoot, logger)`

**Update `index.ts` (CLI router):**
- Remove `watchCommand` import and `case "watch"` handler
- Remove `statusCommand` import and `case "status"` handler
- Update help text to remove watch and status command descriptions
- Consider: add a deprecation notice for `watch` and `status` that says "use `beastmode dashboard` instead"

**Update `lockfile.ts`:**
- If lockfile only existed for the watch command, evaluate whether it's still needed (dashboard may use it for single-instance enforcement)

## Acceptance Criteria

- [ ] `commands/watch.ts` deleted
- [ ] `commands/status.ts` deleted
- [ ] `commands/WatchTreeApp.tsx` deleted
- [ ] `commands/watch-tree-subscriber.ts` deleted
- [ ] `dispatch/reconciling.ts` created with `ReconcilingFactory` extracted from watch.ts
- [ ] `ReconcilingFactory` uses `strategy: "iterm2"` instead of `strategy: "sdk"`
- [ ] `dashboard.ts` directly instantiates `ITermSessionFactory` — no strategy selection
- [ ] `index.ts` no longer routes to watch or status commands
- [ ] CLI help text does not mention watch or status
- [ ] `bun run build` succeeds
