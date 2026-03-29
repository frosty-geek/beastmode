---
phase: plan
epic: handoff-v2
feature: design-frontmatter
slug: handoff-v2-design-frontmatter
status: completed
---

# Design Frontmatter

**Design:** .beastmode/artifacts/design/2026-03-29-handoff-v2.md

## User Stories

1. As the CLI post-dispatch pipeline, I want every phase to produce an artifact with frontmatter so that the Stop hook can reliably generate output.json regardless of phase outcome.
4. As the Stop hook script, I want all artifacts to have `phase`, `slug`, and `status` fields so that output.json generation doesn't need per-phase special-casing for missing fields.

## What to Build

Add `status: completed` to the design checkpoint's artifact frontmatter template. The design checkpoint currently writes `phase` and `slug` but omits `status`, which means the Stop hook must special-case design artifacts. Adding the field brings design in line with the minimum frontmatter contract.

## Acceptance Criteria

- [ ] Design checkpoint template includes `status: completed` in frontmatter
- [ ] Design artifact frontmatter has all three minimum fields: `phase`, `slug`, `status`
