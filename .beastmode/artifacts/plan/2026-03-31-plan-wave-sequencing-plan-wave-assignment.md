---
phase: plan
epic: plan-wave-sequencing
feature: plan-wave-assignment
wave: 1
---

# Plan Wave Assignment

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

1. As a developer, I want the plan phase to group features into sequenced waves, so that dependent features don't start until their prerequisites land.
3. As a developer, I want to see wave groupings in the plan's executive summary before approval, so that I can adjust the sequence if the planner got it wrong.

## What to Build

During plan execute, when decomposing a PRD into features, the planner also proposes wave groupings — identifying which features need foundations from earlier features and grouping them accordingly. Wave assignment happens as part of the normal interview flow: the planner presents proposed waves and the user confirms or adjusts.

Plan validate stamps `wave: N` into each feature plan's YAML frontmatter. The executive summary is extended with a wave-grouped table that includes a rationale column explaining why features are in each wave. This lets the user see and approve the execution sequence before checkpoint writes the files.

Single-feature plans automatically get `wave: 1` with no special handling required.

The wave number is the sole ordering primitive — no explicit dependency graph between features.

## Acceptance Criteria

- [ ] Plan execute proposes wave groupings alongside feature decomposition
- [ ] Plan validate stamps `wave: N` into feature plan YAML frontmatter
- [ ] Executive summary includes wave-grouped table with rationale column
- [ ] User sees wave ordering before approval and can request adjustments
- [ ] Single-feature plans get `wave: 1` automatically
