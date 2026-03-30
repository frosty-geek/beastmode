---
phase: plan
epic: remove-persona-voice
feature: strip-persona-import
---

# Strip Persona Import

**Design:** `.beastmode/artifacts/design/2026-03-30-remove-persona-voice.md`

## User Stories

1. As a skill author, I want persona voice to come from one place (BEASTMODE.md), so that I don't have to trace through a shared import to understand the voice rules.
2. As a pipeline operator, I want fewer shared dependencies between skills, so that phases are more self-contained.
3. As a contributor reading context docs, I want workflow rules to reflect reality, so that I don't follow stale instructions about importing persona.md.

## What to Build

Remove the `skills/_shared/persona.md` shared file and all imports that reference it. The file is a thin pointer to BEASTMODE.md's persona section with added context-awareness examples — BEASTMODE.md already contains the "Factor in time of day and project state" rule, making the shared file redundant indirection.

Three layers of change:

1. **Delete the shared file** — Remove `skills/_shared/persona.md` entirely. The context-awareness examples it contains (groggy morning, mid-implement focus, etc.) are elaborations of what BEASTMODE.md already mandates. No information is lost that isn't already captured at L0.

2. **Remove imports from all phase entry points** — Each skill's `0-prime.md` has an `@../_shared/persona.md` import line in its announce step. Remove only the import line; keep the announce step heading and instruction text ("Greet in persona voice").

3. **Update context documentation** — The L2 workflow doc and L3 persona-system record both document a mandatory "ALWAYS import persona.md" rule that will no longer be true. Update these to reflect that persona voice comes directly from BEASTMODE.md with no shared import.

## Acceptance Criteria

- [ ] `skills/_shared/persona.md` does not exist
- [ ] All 5 `0-prime.md` files (design, plan, implement, validate, release) contain no `@../_shared/persona.md` import
- [ ] All 5 `0-prime.md` files still contain their announce step instruction text
- [ ] `.beastmode/context/plan/workflow.md` persona section no longer references importing persona.md
- [ ] `.beastmode/context/plan/workflow/persona-system.md` reflects that the shared file no longer exists
- [ ] No remaining references to `_shared/persona.md` outside of historical artifacts
