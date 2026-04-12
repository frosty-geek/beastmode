---
phase: design
epic-id: bm-6a38
epic-slug: dashboard-heartbeat-countdown
---

## Problem Statement

The dashboard header shows a static `watch: running` label that provides no indication of when the next scan will happen. Users stare at an unchanging status line with no sense of the watch loop's cadence or liveness.

## Solution

Replace the `watch: running` text in the dashboard header bar with a live `Heartbeat: Xs` countdown that decrements every second. The countdown resets to the full poll interval after each scan completes. When the watch loop is not running, the heartbeat area falls back to showing the watch state (e.g. `stopped`).

## User Stories

1. As a user watching the dashboard, I want to see a countdown to the next scan tick, so that I know the loop is alive and when it will act next.
2. As a user with a stopped watch loop, I want the heartbeat area to show the watch state, so that I'm not confused by a stale countdown.
3. As a developer, I want the countdown timer to be a dedicated 1-second interval independent of the nyan animation tick, so that it doesn't waste CPU computing seconds from an 80ms cadence.

## Implementation Decisions

- Replace the `watch: running` / `watch: stopped` text in the ThreePanelLayout header bar with the heartbeat display
- Format: `Heartbeat: Xs` where X counts down from `intervalSeconds` to 0
- Use a dedicated 1-second `setInterval` timer for the countdown, not the existing 80ms NyanBanner tick
- Store `intervalSeconds` from the WatchLoop `started` event in App state (currently emitted but discarded)
- Reset countdown to `intervalSeconds` when `scan-complete` event fires
- During an active scan, just show the countdown (no special "scanning..." indicator)
- When watch loop is stopped or not yet started, fall back to showing the watch state string instead of a countdown
- Countdown state lives in App.tsx alongside existing watch loop event subscriptions
- Use the existing `ThreePanelLayout` header props to pass the heartbeat text — no new components needed

## Testing Decisions

- Unit test the countdown reset logic: verify countdown resets to intervalSeconds on scan-complete
- Unit test the fallback behavior: verify watch state text is shown when loop is stopped
- Visual verification that the header renders correctly at various countdown values
- Existing dashboard test patterns in the codebase can be referenced for component testing approach

## Out of Scope

- Showing elapsed time for active sessions
- Showing scan duration or scan state indicator
- Countdown in the OverviewPanel
- Any changes to the WatchLoop event protocol (it already emits everything needed)

## Further Notes

None

## Deferred Ideas

None
