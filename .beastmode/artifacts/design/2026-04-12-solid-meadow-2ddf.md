---
phase: design
epic-id: bm-c9ba
epic-slug: solid-meadow-2ddf
epic-slug-renamed: dashboard-heartbeat-countdown-2ddf
---

## Problem Statement

The dashboard header shows static "watch: running" or "watch: stopped" text, giving no visibility into when the next scan will fire. Operators watching the dashboard have no sense of timing — they can't tell if a scan just happened or is about to happen.

## Solution

Replace the static watch status text in the header bar with a live heartbeat countdown that refreshes every second, showing seconds remaining until the next watch loop tick. A `useHeartbeat(loop)` hook subscribes to existing WatchLoop events and computes the countdown; ThreePanelLayout receives a heartbeat state object instead of a boolean.

## User Stories

1. As a dashboard operator, I want to see a live countdown (e.g. "Heartbeat: 47s") in the header bar, so that I know when the next scan will fire without guessing.
2. As a dashboard operator, I want the heartbeat to show descriptive edge states ("Heartbeat: --" before first scan, "Heartbeat: [stopped]" when the loop is stopped), so that I understand what the watch loop is doing at a glance.
3. As a dashboard operator, I want the heartbeat text to change color based on state (green when counting down, yellow when frozen at 0s, red when stopped), so that I get immediate visual feedback on watch loop health.

## Implementation Decisions

- **Placement**: Replace the existing "watch: running/stopped" text in the ThreePanelLayout header bar. Same location, richer content.
- **Timer architecture**: Dedicated 1s `setInterval` owned by `useHeartbeat`, separate from the 80ms nyanTick timer. Clean separation, exact 1s updates.
- **State management**: New `useHeartbeat(loop)` hook in App.tsx subscribes to WatchLoop events (`started`, `scan-complete`, `stopped`), owns the 1s countdown timer, and returns a heartbeat state object.
- **Prop interface change**: Replace `watchRunning: boolean` on ThreePanelLayout with a heartbeat state object (e.g. `{ status: 'counting' | 'frozen' | 'stopped' | 'idle', remainingSeconds: number }`). Remove `watchRunning` from App.tsx state entirely — the heartbeat state subsumes it.
- **Mid-scan behavior**: When the countdown reaches 0s and a tick is executing, freeze display at `0s` with yellow color. No special "scanning" indicator. Countdown resumes after the next `scan-complete`.
- **Early rescan handling**: Any `scan-complete` event resets the countdown to full interval, regardless of whether it was a scheduled tick or an event-triggered rescan.
- **Edge state display**: `Heartbeat: --` before the first scan completes (status: `idle`), `Heartbeat: [stopped]` when the loop is stopped, `Heartbeat: [paused]` when paused/idle after having run.
- **Color scheme**: Green (#A9DC76) for active countdown, yellow (#FFD866) for frozen at 0s or paused, red (#FF6188) for stopped. All colors from the existing monokai-palette module.
- **No new WatchLoop events needed**: Existing `started` (with `intervalSeconds`), `scan-complete`, and `stopped` events provide all necessary timing data.

## Testing Decisions

- Unit test the countdown computation logic extracted from the hook (remaining seconds calculation, edge state transitions, reset on scan-complete)
- Test the `useHeartbeat` hook with a mock WatchLoop emitter to verify event-driven state transitions
- Key test cases: countdown from interval to 0, freeze at 0 (yellow), reset on early rescan, edge state transitions (idle -> counting -> frozen -> stopped -> idle)
- Existing dashboard rendering patterns in the codebase serve as prior art for component tests

## Out of Scope

- Stale data warning (e.g. "last scan was 5 minutes ago")
- Configurable refresh rate (hardcoded 1s)
- Heartbeat in locations other than the header bar
- Per-scan duration tracking or display
- Changes to the WatchLoop polling mechanism itself

## Further Notes

None

## Deferred Ideas

None
