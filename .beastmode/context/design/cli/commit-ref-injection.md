# Commit Ref Injection

## Context
Checkpoint commits contain no reference to the GitHub issues they belong to. There is no trail connecting commits to their epic or feature issues.

## Decision
CLI appends a `<commit-refs>` block to the skill prompt string before SDK dispatch. The block contains `Refs #N` lines built from the manifest's github field via `buildCommitRefs(manifest, featureSlug?)`. Skills read refs from prompt context and append them to git commit messages as separate `-m` arguments.

## Rationale
- Prompt injection keeps skills manifest-unaware and GitHub-unaware — refs arrive as prompt context, not manifest reads
- `Refs` keyword was chosen over `Closes`/`Fixes` to avoid auto-closing issues from checkpoint commits (only release should close)
- Per-feature ref injection at implement fan-out gives granular traceability without skills needing to know which feature they are implementing
- Graceful no-op when github field is absent means the feature has zero impact on non-GitHub workflows
- Interactive `/design` runs without CLI dispatch, so no refs — no behavior change for design phase

## Source
`.beastmode/artifacts/design/2026-03-31-commit-issue-refs.md`
