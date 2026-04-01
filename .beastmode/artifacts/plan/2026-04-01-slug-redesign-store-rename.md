---
phase: plan
epic: slug-redesign
feature: store-rename
wave: 1
---

# Store Rename

**Design:** `.beastmode/artifacts/design/2026-04-01-slug-redesign.md`

## User Stories

1. As a user, I want `beastmode design` to create a worktree with a temp hex and rename it to a readable name after the session, so that branches and manifests are human-friendly (US 1)
2. As a user, I want to look up epics by either hex or name, so I can use whichever I remember (US 3)
3. As a developer, I want a single rename method that handles all slug-keyed resources, so partial renames can't happen (US 4)
4. As a developer, I want collision resolution to use the birth hex as suffix, so naming is deterministic (US 7)

## What to Build

Add three new public methods to the manifest store module: `rename()`, `find()`, and `slugify()`, plus format validation.

**store.rename(projectRoot, hexSlug, epicName, worktreePath)**: Single method that atomically renames all slug-keyed resources. Implements prepare-then-execute strategy — validates all preconditions (format, collision, branch existence, worktree existence) before mutating anything. On mid-execution failure, reports completed steps and fails. The rename sequence is:

1. Slugify + validate format (`[a-z0-9](?:[a-z0-9-]*[a-z0-9])?`)
2. Collision detection — if epic name collides, use `<epic>-<hex>` suffix
3. Rename design artifacts in worktree (.md + .output.json files, update frontmatter)
4. Commit renamed artifacts in worktree
5. Rename git branch (`feature/hex` → `feature/epic`)
6. Move worktree directory + repair git metadata
7. Rename manifest file
8. Update manifest content: set `epic`, set `originId` to the birth hex

The logic is absorbed from the existing standalone rename module. The manifest is gitignored — only step 4 requires a git commit.

**store.find(identifier)**: Resolves an epic by either hex slug or epic name. Scans manifests checking both the `slug` field (hex) and `epic` field (name). Returns the matching manifest or undefined.

**slugify(input)**: Normalizes a string to a valid slug format. Format validation enforces `[a-z0-9](?:[a-z0-9-]*[a-z0-9])?`. Both slugify and validation are colocated in the store as the single chokepoint for slug formatting.

**originId**: New field on the manifest schema, persisted after rename for lineage tracking (birth hex → final epic name).

Unit tests cover: rename happy path, collision resolution with hex suffix, format validation rejection, precondition failure (missing branch/worktree), mid-execution failure and report, find by hex, find by epic name, slugify edge cases.

## Acceptance Criteria

- [ ] `store.rename()` renames git branch, worktree dir, git metadata, manifest file, manifest content, and design artifacts in a single call
- [ ] Precondition failures (invalid format, missing branch) abort before any mutation
- [ ] Mid-execution failure returns a result listing completed steps
- [ ] Collision resolution deterministically uses `<epic>-<hex>` suffix instead of `-v2`
- [ ] `store.find()` resolves by hex slug or epic name
- [ ] `slugify()` normalizes input and validates against `[a-z0-9](?:[a-z0-9-]*[a-z0-9])?`
- [ ] `originId` field is set on manifest after rename
- [ ] All new methods have unit tests covering happy paths and edge cases
