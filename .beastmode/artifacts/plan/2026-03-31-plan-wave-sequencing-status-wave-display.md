---
phase: plan
epic: plan-wave-sequencing
feature: status-wave-display
wave: 3
---

# Status Wave Display

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

4. As a developer, I want `beastmode status` to show wave progress, so that I can see where the pipeline is in the execution sequence.

## What to Build

Extend the `beastmode status` command to surface wave progress. The default view adds a compact wave indicator to the existing table — something like `W1/3` meaning "currently on wave 1 of 3 total waves." The indicator reflects the current active wave (lowest wave with any incomplete features).

Verbose mode (`--verbose`) expands to per-wave rows showing feature counts and statuses within each wave, giving a complete picture of the execution sequence.

For backwards compatibility, epics whose features have no wave data (or all wave 1) show no wave indicator — the display is unchanged for single-wave plans.

The status command reads wave data from the manifest's `ManifestFeature.wave` field. No additional state files or caches are needed.

## Acceptance Criteria

- [ ] Default status view shows compact wave indicator (e.g., `W1/3`) for multi-wave epics
- [ ] Verbose mode shows per-wave breakdown with feature counts and statuses
- [ ] Epics without wave data or single-wave epics show no wave indicator
- [ ] Wave indicator reflects the current active wave (lowest incomplete)
