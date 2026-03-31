---
phase: plan
epic: plan-wave-sequencing
feature: manifest-wave-field
wave: 2
---

# Manifest Wave Field

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

2. As a developer, I want the watch loop to dispatch features wave-by-wave, so that independent features run in parallel while dependent ones wait.
5. As a developer, I want existing single-wave plans to work unchanged, so that backwards compatibility is preserved without migration.

## What to Build

Extend the `ManifestFeature` type with a `wave: number` field that defaults to `1` for backwards compatibility. Existing manifests without wave fields behave exactly as today — all features in wave 1, all dispatched in parallel.

The plan phase output.json already carries per-feature metadata. The `wave` field flows through the existing pipeline: plan skill stamps it in frontmatter, stop hook extracts it into output.json, and manifest enrichment reads it from the plan output and stores it on each `ManifestFeature`.

The wave-filtering logic lives in `dispatchFanOut()` — the state machine stays unchanged. `dispatchFanOut()` finds the lowest wave number with any pending or in-progress features and only dispatches features from that wave. If any feature in wave N is blocked or incomplete, wave N+1 does not start. This is strict wave blocking — a stuck feature requires human intervention before later waves proceed.

## Acceptance Criteria

- [ ] `ManifestFeature` type includes `wave: number` field
- [ ] Manifests without `wave` field default to wave 1 (backwards compatible)
- [ ] Plan output.json includes `wave` per feature in the features array
- [ ] Manifest enrichment reads and stores wave from plan output
- [ ] `dispatchFanOut()` only dispatches features from the current lowest incomplete wave
- [ ] Blocked feature in wave N prevents wave N+1 features from dispatching
- [ ] Existing single-wave plans work unchanged without migration
