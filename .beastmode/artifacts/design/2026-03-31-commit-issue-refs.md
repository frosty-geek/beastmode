---
phase: design
slug: commit-issue-refs
---

## Problem Statement

Checkpoint commits follow the pattern "implement(consumer-swap): checkpoint" but contain no reference to the GitHub issue they belong to. There is no trail connecting commits to their epic or feature issues, making it difficult to trace work history from GitHub.

## Solution

CLI appends a `<commit-refs>` block to the skill prompt before SDK dispatch. The block contains `Refs #N` lines built from the manifest's github field. Skill checkpoint instructions read the refs from prompt context and append them to the commit body. GitHub auto-links the rest — commits appear in issue timelines, issues appear in commit views.

## User Stories

1. As a developer reviewing history, I want checkpoint commits to reference their GitHub issue, so that I can trace commits to the epic they belong to.
2. As a developer viewing a GitHub issue, I want to see linked commits in the issue timeline, so that I can follow implementation progress without leaving GitHub.
3. As a pipeline operator, I want commit-issue linking to work automatically without manual intervention, so that the documentation trail is always complete.

## Implementation Decisions

- CLI builds `<commit-refs>` block from manifest's github field and appends it to the prompt string in sdk-runner.ts before dispatch
- Skills stay fully manifest-unaware — they read refs from prompt context only, not from manifest files
- `Refs` keyword (not `Closes` or `Fixes`) — links commits to issues without closing them
- Epic ref (`Refs #<epic>`) is always included when manifest has a github field
- For implement fan-out, each per-feature dispatch gets the epic ref plus that feature's ref (`Refs #<feature>`) when `feature.github.issue` exists
- Release squash-merge commit on main gets epic ref only — feature refs live on the feature branch history (archived at release)
- Graceful no-op when manifest lacks github field — no `<commit-refs>` block appended, skill checkpoint sees nothing and commits as today
- Interactive `/design` runs without CLI dispatch, so no refs — no behavior change
- `buildCommitRefs(manifest, featureSlug?)` utility function in CLI builds the refs block from manifest data
- Skill checkpoint steps updated to: if `<commit-refs>` block is present in prompt context, append each line as a `-m` argument to `git commit`

## Testing Decisions

- Verify `buildCommitRefs()` produces correct refs for: epic-only, epic+feature, no-github-field cases
- Verify prompt string contains `<commit-refs>` block when manifest has github field
- Verify prompt string has no `<commit-refs>` block when manifest lacks github field
- Verify checkpoint commit messages contain `Refs #N` lines when refs are present
- Verify checkpoint commit messages are unchanged when refs are absent
- Prior art: checkpoint steps in all 5 phase skills already run `git commit` commands

## Out of Scope

- Branch naming conventions (feature/144-slug)
- PR-to-issue linking (handled by GitHub automatically via branch naming)
- Retroactive linking of existing commits
- Modifying the release tag message with refs

## Further Notes

Depends on github-sync-fix PRD being implemented first — without working sync, manifests may not have github fields populated.

## Deferred Ideas

None
