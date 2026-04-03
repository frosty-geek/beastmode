---
phase: plan
slug: watch-log-format
epic: watch-log-format
feature: cost-guard
wave: 2
---

# Cost Guard

**Design:** `.beastmode/artifacts/design/2026-04-03-watch-log-format.md`

## User Stories

4. As an operator watching the pipeline, I want the watch loop to not crash on `costUsd.toFixed()` when cost data is missing so that session errors are reported cleanly.

## What to Build

**Type Definitions:** Add `costUsd` as an optional field (`costUsd?: number`) to the `SessionCompletedEvent` interface and `SessionResult` interface in the watch types module. This makes the type system reflect reality — session errors may not include cost data.

**Watch Loop Guard:** In `attachLoggerSubscriber`'s `session-completed` handler, check whether `costUsd` is defined before formatting it. When undefined, omit the cost portion entirely from the completion message (do not default to `$0.00`). The message becomes `${status} (${dur}s)` instead of `${status} ($${cost}, ${dur}s)`.

**Dashboard Guard:** In the dashboard App component's `onSessionCompleted` handler, apply the same guard. When `costUsd` is undefined, omit cost from the event detail string.

**No behavioral change** when costUsd is present — the formatting remains `$X.XX`.

## Acceptance Criteria

- [ ] `SessionCompletedEvent` type includes `costUsd?: number` (optional)
- [ ] `SessionResult` type includes `costUsd?: number` (optional)
- [ ] Watch loop completion message omits cost when costUsd is undefined
- [ ] Watch loop completion message shows cost normally when costUsd is defined
- [ ] Dashboard completion event omits cost when costUsd is undefined
- [ ] No runtime crash when session completes without cost data
