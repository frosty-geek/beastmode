---
phase: plan
epic: slug-redesign
feature: dispatch-cleanup
wave: 2
---

# Dispatch Cleanup

**Design:** `.beastmode/artifacts/design/2026-04-01-slug-redesign.md`

## User Stories

1. As a user, I want `beastmode design` to create a worktree with a temp hex and rename it to a readable name after the session, so that branches and manifests are human-friendly (US 1)
2. As a user, I want non-design phases to fail fast if the slug doesn't exist, so I don't get orphaned worktrees (US 2)
3. As a user, I want the output.json to be findable by hex, so stale artifacts from previous sessions can't cause mismatches (US 8)

## What to Build

Wire the new store API into the dispatch pipeline, delete superseded code paths, and add fail-fast behavior for non-design phases.

**Delete rename-slug.ts**: The entire standalone rename module is removed. Its logic has been absorbed into `store.rename()` (from the store-rename feature). All imports and call sites are updated to use the store method instead.

**Delete resolveDesignSlug()**: The function in post-dispatch.ts that parses the latest git commit message with a regex to extract the slug is removed. The design skill writes `slug` (hex) and `epic` (derived name) in frontmatter, the stop hook captures these in output.json, and the CLI reads output.json directly. No commit message parsing needed.

**Wire store.rename() into post-dispatch**: After the machine events are processed for a design phase dispatch, call `store.rename()` with the hex slug and the epic name extracted from output.json. This replaces the old `renameEpicSlug()` call site.

**Fail-fast for non-design phases**: Before creating a worktree or starting branch operations for non-design phases (plan, implement, validate, release), verify the slug exists in the store via `store.find()`. If not found, fail immediately with a clear error message. Design creates the slug and worktree; all other phases are read-only with respect to slug identity.

**Output.json hex-based lookup**: The CLI finds output.json by hex match instead of by epic name. Since hex is immutable and assigned at creation, this eliminates mismatches from stale artifacts belonging to previous sessions with the same epic name.

## Acceptance Criteria

- [ ] `rename-slug.ts` is deleted with no remaining imports
- [ ] `resolveDesignSlug()` is deleted from post-dispatch.ts
- [ ] Post-dispatch calls `store.rename()` for design phase completion
- [ ] Non-design phases fail fast with clear error if slug not found in store
- [ ] Output.json is located by hex slug match, not epic name
- [ ] Design → post-dispatch → rename flow works end-to-end with actual git operations
- [ ] No orphaned worktrees created when slug is missing
