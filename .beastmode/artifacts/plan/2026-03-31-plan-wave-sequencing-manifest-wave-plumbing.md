---
phase: plan
epic: plan-wave-sequencing
feature: manifest-wave-plumbing
wave: 1
---

# Manifest Wave Plumbing

**Design:** `.beastmode/artifacts/design/2026-03-31-plan-wave-sequencing.md`

## User Stories

5. As a developer, I want existing single-wave plans to work unchanged, so that backwards compatibility is preserved without migration.

## What to Build

Thread the `wave` field through the entire data pipeline from plan artifacts to runtime manifest state.

**ManifestFeature type (manifest-store.ts):** Add an optional `wave` field of type `number` to the `ManifestFeature` interface. The field is optional so existing manifests without it continue to work.

**Stop hook / output.json generation (generate-output.ts):** When scanning plan artifacts to build the plan phase output, read the `wave` field from each feature plan's YAML frontmatter and include it in the features array of the output.json. If a feature has no wave in its frontmatter, default to `1`.

**Manifest enrichment (manifest.ts):** When `enrich()` merges incoming features into the manifest, carry forward the `wave` field. Preserve existing wave values during merges (same logic as preserving `github` info). Default to `1` when the field is absent — this ensures manifests created before wave support still work identically.

**State scanner (state-scanner.ts):** No changes needed — it already reads manifest features as-is and passes them through to `deriveNextAction()`.

## Acceptance Criteria

- [ ] `ManifestFeature` interface includes optional `wave: number` field
- [ ] `generate-output.ts` reads `wave` from plan artifact frontmatter and includes it in output.json features
- [ ] `enrich()` preserves wave field during feature merges
- [ ] Missing wave field defaults to `1` at every pipeline stage
- [ ] Existing manifests without wave field continue to work with no behavioral change
- [ ] Existing tests pass without modification (backwards compatibility)
