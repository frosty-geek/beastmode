---
phase: plan
epic: handoff-v2
feature: implement-normalize
slug: handoff-v2-implement-normalize
status: completed
---

# Implement Normalize

**Design:** .beastmode/artifacts/design/2026-03-29-handoff-v2.md

## User Stories

1. As the CLI post-dispatch pipeline, I want every phase to produce an artifact with frontmatter so that the Stop hook can reliably generate output.json regardless of phase outcome.
2. As the watch loop, I want every phase to end with STOP so that session termination is unambiguous and the Stop hook fires consistently.
3. As a user reading handoff output, I want all phases to use the same `beastmode <phase> <slug>` format so that I can copy-paste the next command without thinking about whether it's a slash command or CLI command.
4. As the Stop hook script, I want all artifacts to have `phase`, `slug`, and `status` fields so that output.json generation doesn't need per-phase special-casing for missing fields.

## What to Build

Two changes to the implement checkpoint:

1. **Always-write artifact**: The implement checkpoint currently only writes an artifact when deviations exist. Change it to always write a completion artifact with standardized frontmatter (`phase`, `slug`, `status`, `epic`, `feature`). Deviation details are appended to this artifact when they exist, but the artifact itself is unconditional.

2. **Fix handoff format**: Change the next-step command from `/validate` (slash command format) to `beastmode validate <slug>` (CLI command format) to match the uniform handoff contract.

## Acceptance Criteria

- [ ] Implement checkpoint always writes an artifact, even with zero deviations
- [ ] Artifact frontmatter includes `phase`, `slug`, `status`, `epic`, `feature`
- [ ] Handoff command reads `Next: beastmode validate <slug>` instead of `Next: /validate`
