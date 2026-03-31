---
phase: plan
epic: plan-wave-sequencing
feature: wave-dispatch
wave: 2
---

# Wave Dispatch

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

2. As a developer, I want the watch loop to dispatch features wave-by-wave, so that independent features run in parallel while dependent ones wait.

## What to Build

Modify the watch loop's fan-out dispatch to respect wave ordering. The state machine (`deriveNextAction()`) remains unchanged — wave filtering happens in `dispatchFanOut()`.

**dispatchFanOut() (watch.ts):** Before dispatching features, determine the current wave — the lowest wave number that has any pending or in-progress features. Only dispatch features whose wave matches the current wave. Features in higher waves remain undispatched until all features in the current wave reach a terminal state (completed or cancelled). If any feature in the current wave is blocked, features in later waves still do not dispatch — strict wave blocking.

**Wave determination logic:** Read the `wave` field from each `ManifestFeature`. Features without a wave field are treated as wave 1 (backwards compatibility). Sort features by wave, find the minimum wave with non-terminal features, and filter the dispatch list to only that wave.

**No changes to deriveNextAction():** The state machine continues to return all pending/in-progress features. The wave filtering is purely a dispatch-time concern. This keeps the state machine simple and testable independently of wave logic.

## Acceptance Criteria

- [ ] `dispatchFanOut()` only dispatches features from the lowest incomplete wave
- [ ] Features in wave N+1 do not dispatch while any wave N feature is pending, in-progress, or blocked
- [ ] A blocked feature in wave N prevents all wave N+1 features from dispatching
- [ ] Features without a wave field dispatch as wave 1 (backwards compatibility)
- [ ] Multiple features within the same wave dispatch in parallel (existing behavior preserved)
- [ ] When all wave N features complete, wave N+1 features dispatch on the next scan
