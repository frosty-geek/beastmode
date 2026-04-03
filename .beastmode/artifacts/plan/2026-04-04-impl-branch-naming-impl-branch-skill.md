---
phase: plan
slug: 1581c9
epic: impl-branch-naming
feature: impl-branch-skill
wave: 1
---

# impl-branch-skill

**Design:** .beastmode/artifacts/design/2026-04-04-1581c9.md

## User Stories

2. As the implement skill, I want to verify I'm on the correct `impl/<slug>--<feature>` branch at prime, so that agents commit to the right branch without needing to create it.

## What to Build

### Update Prime Branch Verification

The implement skill's Phase 0 (Prime) includes a branch verification step that checks the current branch matches the expected naming convention. Update this check from the old `feature/${epic}/${feature}` pattern to the new `impl/${epic}--${feature}` pattern.

The skill does NOT create the branch — it only verifies the branch exists and is checked out. Branch creation is CLI-owned. If the branch doesn't match, the skill errors with a clear message indicating the expected branch name.

### Update Branch References

Any other references to the old `feature/<slug>/<feature>` pattern in the implement skill (comments, documentation, agent instructions) should be updated to reflect `impl/<slug>--<feature>`.

## Acceptance Criteria

- [ ] Implement SKILL.md Prime phase checks for `impl/${epic}--${feature}` branch pattern
- [ ] Old `feature/${epic}/${feature}` pattern is fully replaced — no remnants
- [ ] Error message on branch mismatch includes the expected `impl/` branch name
- [ ] No branch creation logic added to the skill — verification only
