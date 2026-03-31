---
phase: plan
epic: plan-wave-sequencing
feature: status-wave-display
wave: 2
---

# Status Wave Display

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

4. As a developer, I want `beastmode status` to show wave progress, so that I can see where the pipeline is in the execution sequence.

## What to Build

Extend the `beastmode status` command to display wave progress information at two detail levels.

**Compact view (default):** Add a wave indicator to the Features column or as a new column. When an epic has wave data, show the current wave and total wave count in a compact format like `W1/3` (wave 1 of 3 in progress). When an epic has no wave data (all wave 1, single-wave), omit the indicator to preserve backwards-compatible output.

**Verbose view (--verbose or -v):** When verbosity is enabled, expand the status display to show per-wave detail. Each wave gets its own sub-row or section showing the wave number, the count of features in that wave, and their aggregate status (e.g., "3/3 completed", "1/2 in-progress"). This gives a quick scan of where the pipeline is and which wave is currently active.

**Data source:** Read wave information from the manifest's features array. The `wave` field on `ManifestFeature` is the source of truth. Group features by wave, determine the current active wave (lowest with non-terminal features), and compute per-wave statistics.

## Acceptance Criteria

- [ ] Default status view shows compact wave indicator (e.g., `W1/3`) for multi-wave epics
- [ ] Single-wave or wave-less epics display without wave indicator (backwards compatible)
- [ ] Verbose mode shows per-wave breakdown with feature counts and statuses
- [ ] Current active wave is visually distinguishable in verbose mode
- [ ] Wave display works correctly in watch mode (continuous refresh)
- [ ] Status command tests updated to cover wave display scenarios
