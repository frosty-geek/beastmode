---
phase: plan
epic: slug-redesign
feature: persist-consolidation
wave: 2
---

# Persist Consolidation

**Design:** `.beastmode/artifacts/design/2026-04-01-slug-redesign.md`

## User Stories

1. As a developer, I want one persist call per dispatch, so manifest state can't diverge between multiple writes (US 6)

## What to Build

Collapse the multi-write persist pattern into a single `store.save()` call at the end of each dispatch cycle.

**Machine persist action**: Convert from disk-writing to memory-only. Currently the XState persist action (injected into the epic machine) calls `store.save()` after every state transition — sometimes 5+ times per dispatch. Change this to accumulate state changes in memory. The actor snapshot is still captured, but no disk write occurs until the final post-dispatch save.

**store.save() cleanup**: Remove the rename detection and file-rename logic currently at lines 184-198 of manifest-store.ts. `save()` becomes a pure write-to-disk operation — it receives the final manifest state and writes it. All rename logic lives in `store.rename()` (from the store-rename feature).

**skipFinalPersist deletion**: This flag existed because `renameEpicSlug()` already persisted the manifest, so the final save was skipped to avoid overwriting. With rename logic moved to `store.rename()` (which updates in-memory state but doesn't persist), the single final `store.save()` always runs. The flag and its branching logic are deleted.

**Post-dispatch flow simplification**: The persist flow in post-dispatch.ts becomes linear:
1. Hydrate actor, send events, accumulate context changes (memory only)
2. If design phase: call `store.rename()` (updates manifest fields in memory)
3. Single `store.save()` writes final state to disk
4. GitHub sync (warn-and-continue)

## Acceptance Criteria

- [ ] Machine persist action accumulates state in memory without disk writes
- [ ] `store.save()` is a pure write — no rename detection, no file manipulation beyond writing the manifest
- [ ] Exactly one `store.save()` call occurs per dispatch cycle
- [ ] `skipFinalPersist` flag and its branching logic are deleted
- [ ] Post-dispatch flow is linear: events → rename (if design) → save → sync
- [ ] Existing machine tests pass with memory-only persist behavior
