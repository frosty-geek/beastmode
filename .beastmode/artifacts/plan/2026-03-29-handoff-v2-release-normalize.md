---
phase: plan
epic: handoff-v2
feature: release-normalize
slug: handoff-v2-release-normalize
status: completed
---

# Release Normalize

**Design:** .beastmode/artifacts/design/2026-03-29-handoff-v2.md

## User Stories

1. As the CLI post-dispatch pipeline, I want every phase to produce an artifact with frontmatter so that the Stop hook can reliably generate output.json regardless of phase outcome.
2. As the watch loop, I want every phase to end with STOP so that session termination is unambiguous and the Stop hook fires consistently.
4. As the Stop hook script, I want all artifacts to have `phase`, `slug`, and `status` fields so that output.json generation doesn't need per-phase special-casing for missing fields.

## What to Build

Two changes to the release checkpoint:

1. **Add status to frontmatter**: The release checkpoint currently writes `phase`, `slug`, and `bump` but omits `status`. Add `status: completed` to bring it in line with the minimum frontmatter contract.

2. **Add STOP termination**: The release checkpoint currently ends with "Release complete." without STOP. Append `STOP. No additional output.` after the marketplace update suggestions and "Release complete." message.

## Acceptance Criteria

- [ ] Release artifact frontmatter includes `status: completed` alongside `phase`, `slug`, `bump`
- [ ] Release checkpoint ends with `STOP. No additional output.`
