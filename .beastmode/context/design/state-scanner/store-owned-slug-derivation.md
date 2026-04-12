# Store-Owned Slug Derivation

## Context
Slug derivation logic was scattered across phase.ts (`deriveWorktreeSlug`), runner.ts (Step 0 entity creation), and reconcile.ts (post-design rename with hex suffix append). Each caller independently constructed the `{slugify(name)}-{hex}` format, creating three sources of truth for the same computation. reconcile.ts also performed side effects (tag rename, artifact rename) alongside store mutations, making it difficult to test and reason about.

## Decision
Slug derivation is centralized in `InMemoryTaskStore.deriveEpicSlug(name, id)` as a private method. `EpicPatch` excludes the `slug` field — callers update `name`, and `updateEpic()` auto-derives the new slug. `addPlaceholderEpic()` generates a hacker-jargon name (deterministic adjective-noun from hex ID) and creates the epic in one call, replacing scattered `generatePlaceholderName` calls in phase.ts. `reconcileDesign` is now a pure store mutator — it reads `epic-name` from output.json, calls `store.updateEpic(id, { name })`, and returns. All side effects (tag rename, artifact file rename, artifact frontmatter update, worktree directory/branch/git-metadata rename) are handled by the runner after reconcile returns.

## Rationale
Three separate slug derivation paths is a bug waiting to happen — any format change must be replicated in three places. Moving derivation into the store's `updateEpic` path guarantees format consistency: the slug is always `{slugify(name)}-{hex}` regardless of caller. Excluding `slug` from `EpicPatch` prevents callers from directly setting an inconsistent slug. Separating reconcile (pure store mutation) from runner (side effects) improves testability — reconcile tests don't need filesystem mocks for tag rename or file operations.

## Source
Commits be0b1644, bafca1c6, 53a812b7, a2f092bb, 4f76c428 (2026-04-12)
