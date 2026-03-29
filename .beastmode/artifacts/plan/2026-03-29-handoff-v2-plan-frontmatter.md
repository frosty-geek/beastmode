---
phase: plan
epic: handoff-v2
feature: plan-frontmatter
slug: handoff-v2-plan-frontmatter
status: completed
---

# Plan Frontmatter

**Design:** .beastmode/artifacts/design/2026-03-29-handoff-v2.md

## User Stories

1. As the CLI post-dispatch pipeline, I want every phase to produce an artifact with frontmatter so that the Stop hook can reliably generate output.json regardless of phase outcome.
4. As the Stop hook script, I want all artifacts to have `phase`, `slug`, and `status` fields so that output.json generation doesn't need per-phase special-casing for missing fields.

## What to Build

Add `slug` and `status` to the plan checkpoint's artifact frontmatter template. The plan checkpoint currently writes `phase`, `epic`, and `feature` but omits `slug` and `status`. The `slug` should be the composite `<epic>-<feature>` to match the minimum contract while preserving the plan-specific extras (`epic`, `feature`).

## Acceptance Criteria

- [ ] Plan checkpoint template includes `slug: <epic>-<feature>` in frontmatter
- [ ] Plan checkpoint template includes `status: completed` in frontmatter
- [ ] Plan artifact frontmatter has all three minimum fields plus extras: `phase`, `slug`, `status`, `epic`, `feature`
