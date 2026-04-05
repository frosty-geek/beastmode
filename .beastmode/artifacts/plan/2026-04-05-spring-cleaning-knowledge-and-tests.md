---
phase: plan
slug: spring-cleaning
epic: spring-cleaning
feature: knowledge-and-tests
wave: 4
---

# Knowledge and Tests

**Design:** `.beastmode/artifacts/design/2026-04-05-spring-cleaning.md`

## User Stories

7. As a developer, I want design docs, context tree entries, and L2/L3 knowledge updated to reflect the simplified architecture, so that project knowledge stays accurate.
8. As a developer, I want dead test files identified and removed on a case-by-case basis, so that the test suite only covers living code.

## What to Build

**Delete dead test files** (tests for removed code only):
- `cmux-client.test.ts` — tests CmuxClient (deleted)
- `cmux-session.test.ts` — tests CmuxSessionFactory (deleted)
- `sdk-streaming.test.ts` — tests RingBuffer and SessionEmitter (deleted)
- `sdk-dispatch-streaming.test.ts` — tests dispatchPhase SDK streaming (deleted)
- `iterm2-strategy.test.ts` — tests selectStrategy() (deleted with watch.ts)
- `reconcile-startup.test.ts` — tests reconcileStartup() (deleted with startup.ts)
- `status.test.ts` — tests status command (deleted)
- `watch.test.ts` — tests watch command (deleted)
- `watch-tree-app.test.ts` — tests WatchTreeApp (deleted)
- `watch-tree-subscriber.test.ts` — tests watch tree subscriber (deleted)
- `dashboard-strategy.test.ts` — tests dashboard strategy selection (strategy selection removed)

**Preserve test files** (tests for surviving code):
- `it2-client.test.ts` — tests It2Client (survives)
- `it2-session.test.ts` — tests ITermSessionFactory (survives)
- `iterm2-detect.test.ts` — tests iterm2Available() (survives)
- `interactive-runner.test.ts` — tests runInteractive() (survives)
- `reconciling-factory-cleanup.test.ts` — tests ReconcilingFactory cleanup (survives, may need import path update)
- `watch-dispatch.test.ts` — evaluate: if it tests WatchLoop dispatch mechanics (survives), keep; if it tests watch command wiring, delete
- `watch-dispatch-race.test.ts` — evaluate: same as above
- `watch-events.test.ts` — evaluate: if it tests WatchLoop events (survives), keep
- `wave-dispatch.test.ts` — evaluate: tests implement fan-out (survives)
- `use-dashboard-tree-state.test.ts` — keep but update (remove SessionEmitter/events references)
- `phase-dispatch.test.ts` — evaluate: if it tests phase.ts (survives), keep

**Review BDD support files:**
- `features/support/watch-world.ts` — if it creates mock SessionFactory/SessionEmitter, strip SDK references
- `features/support/dashboard-dispatch-hooks.ts` — update for iTerm2-only dispatch
- `features/step_definitions/watch-loop.steps.ts` — keep (tests WatchLoop, not watch command)
- `features/step_definitions/dashboard-dispatch-fix.steps.ts` — update for simplified dispatch

**Update context tree entries:**
- Remove or update L2/L3 files under `context/design/cmux-integration/` (entire subtree — cmux is gone)
- Update `context/design/cli/sdk-integration.md` — remove SDK dispatch references, reflect iTerm2-only
- Update `context/design/cli/configuration.md` — remove dispatch-strategy config documentation
- Update `context/design/dashboard/sdk-dispatch-override.md` — remove or rewrite (SDK dispatch is gone)
- Update `context/design/dashboard/event-log-fallback.md` — simplify (no longer a "fallback" — it's the only log path)
- Update `context/design/orchestration.md` — remove cmux/SDK dispatch references
- Update `context/implement/cmux-integration.md` and subtree — delete entirely
- Update `context/implement/state-scanning/status-display.md` — remove status command references
- Update L0 summaries (`context/DESIGN.md`, `context/IMPLEMENT.md`) if they reference cmux, SDK dispatch, or removed commands

**Prune design artifacts:**
- Design artifacts (`.beastmode/artifacts/design/2026-03-28-cmux-integration.md` etc.) are historical records — do NOT delete them. They document past decisions. But update any L2/L3 context entries that link to them as "current" design.

## Acceptance Criteria

- [ ] All test files for deleted code are removed (11+ files)
- [ ] Surviving test files compile and pass
- [ ] No test file imports a deleted module
- [ ] `context/design/cmux-integration/` subtree removed or archived
- [ ] `context/implement/cmux-integration/` subtree removed
- [ ] SDK dispatch references removed from context tree entries
- [ ] Status/watch command references removed from context tree entries
- [ ] L0 summaries updated to reflect iTerm2-only architecture
- [ ] Historical design artifacts preserved (not deleted)
- [ ] `grep -r "cmux\|SdkSessionFactory\|dispatchPhase\|beastmode watch\|beastmode status" .beastmode/context/` returns no hits in active context files
