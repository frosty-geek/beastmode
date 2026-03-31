---
phase: plan
epic: plan-wave-sequencing
feature: plan-skill-waves
wave: 1
---

# Plan Skill Waves

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

1. As a developer, I want the plan phase to group features into sequenced waves, so that dependent features don't start until their prerequisites land.
3. As a developer, I want to see wave groupings in the plan's executive summary before approval, so that I can adjust the sequence if the planner got it wrong.

## What to Build

Extend the plan phase skill across its execute, validate, and checkpoint sub-phases to support wave-based feature sequencing.

**Execute phase (1-execute.md):** After decomposing the PRD into features, the planner identifies ordering dependencies between features and groups them into numbered waves. Each feature gets a proposed wave number. The wave assignment rationale is captured alongside the feature list. Features within the same wave are independently implementable in parallel; features in later waves depend on earlier waves completing first.

**Validate phase (2-validate.md):** The executive summary is extended with a wave-grouped table that shows features organized by wave with a rationale column explaining why each feature is in its wave. The coverage check and completeness check continue to work as before, with the addition of verifying that every feature has a wave assignment.

**Checkpoint phase (3-checkpoint.md):** When writing feature plan files, the `wave: N` field is stamped into the YAML frontmatter of each feature plan artifact. The feature-format reference template is updated to include the wave field.

**Feature format reference (feature-format.md):** Updated to include `wave: <integer>` in the frontmatter template and document its meaning.

## Acceptance Criteria

- [ ] Plan execute proposes wave assignments for all features during decomposition
- [ ] Plan validate executive summary shows a wave-grouped table with rationale column
- [ ] Plan validate completeness check verifies every feature has a wave assignment
- [ ] Feature plan artifacts include `wave: N` in YAML frontmatter
- [ ] Feature format reference documents the wave field
- [ ] Single-feature plans default to wave 1
