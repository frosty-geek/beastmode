---
phase: plan
epic: slug-redesign
feature: frontmatter-standard
wave: 1
---

# Frontmatter Standard

**Design:** `.beastmode/artifacts/design/2026-04-01-slug-redesign.md`

## User Stories

1. As a developer, I want consistent frontmatter across all phases, so the stop hook and CLI don't need per-phase special cases (US 5)
2. As a user, I want the output.json to be findable by hex, so stale artifacts from previous sessions can't cause mismatches (US 8)

## What to Build

Standardize YAML frontmatter fields across all phase artifacts and update the stop hook's output builder to match.

**Frontmatter standardization**: All phases consistently use `phase`, `slug` (hex), and `epic` (human name). Phase-specific additions:

| Phase | Always present | Phase-specific |
|-------|---------------|----------------|
| Design | `phase`, `slug`, `epic` | — |
| Plan | `phase`, `slug`, `epic`, `feature` | `wave` |
| Implement | `phase`, `slug`, `epic`, `feature` | `status` |
| Validate | `phase`, `slug`, `epic` | `status` |
| Release | `phase`, `slug`, `epic` | `bump` |

The `epic` field in plan/implement frontmatter already uses this key — the change is making `slug` consistently mean hex and adding `epic` to phases that only had `slug` (like design, validate, release).

**Stop hook updates (generate-output.ts)**: The `parseFrontmatter()` function and `buildOutput()` builder need to emit the `epic` field in design output. The `scanPlanFeatures()` function should match on `epic` field from standardized frontmatter. Output.json files should be keyed by hex slug for unambiguous lookup.

**filenameMatchesEpic() update**: During the design phase transition window, files may be hex-named (pre-rename) or epic-named (post-rename). The matching function in phase-output.ts needs to handle both naming patterns gracefully.

**Skill frontmatter templates**: Update the plan skill's feature-format template and any skill-level artifact templates to use the standardized field set.

## Acceptance Criteria

- [ ] All phase artifact templates use standardized frontmatter fields (`phase`, `slug`, `epic` at minimum)
- [ ] `slug` consistently means hex across all phases
- [ ] `epic` field is present in design output.json
- [ ] `parseFrontmatter()` extracts both `slug` and `epic` fields
- [ ] `buildOutput()` includes `epic` in design phase output
- [ ] `filenameMatchesEpic()` handles both hex-named and epic-named files during design transition
- [ ] `scanPlanFeatures()` matches on standardized `epic` field
