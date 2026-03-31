---
phase: design
slug: github-issue-enrichment
---

## Problem Statement

Epic and feature issues are created with stub descriptions ("## slug / Phase: plan" for epics, "## slug / Epic: #N" for features). These are useless for documentation — there's no way to understand what an epic is about or what a feature entails by looking at the GitHub issue.

## Solution

Store summary fields in the manifest. Design checkpoint writes problem and solution text to a manifest summary field. Plan checkpoint writes a description per feature. syncGitHub formats issue bodies from these summaries and updates them on every sync pass. Epic bodies include a feature checklist with issue links and completion status.

## User Stories

1. As a stakeholder viewing the project board, I want epic issues to describe the problem being solved and the approach, so that I can understand work-in-progress without reading local files.
2. As a developer picking up a feature, I want the feature issue to contain the plan description and user stories, so that I can understand the scope from GitHub alone.
3. As a pipeline operator, I want epic issue bodies to include a feature checklist with completion status, so that the epic issue serves as a progress dashboard.
4. As a developer, I want issue descriptions to stay current as the epic progresses through phases, so that GitHub issues are living documentation.

## Implementation Decisions

- Add summary field to PipelineManifest: `{ problem: string, solution: string }` — populated by design checkpoint
- Add description field to ManifestFeature — populated by plan checkpoint
- Sync formats epic body: phase badge, problem statement, solution summary, feature checklist with [x]/#N links
- Sync formats feature body: description text, epic back-reference
- Update issue body on every sync pass via ghIssueEdit — requires adding body param to ghIssueEdit in gh.ts
- `gh issue edit --body` supports full markdown — no content limitations
- Body updates use hash-compare before API call — `github.bodyHash` field in manifest's github block stores last-written hash, sync skips API call if hash matches, zero audit log noise
- Feature checklist shows unlinked features (no issue yet) as plain text without issue link — shows scope during early phases
- Feature checklist hides cancelled features — active scope only
- Feature checklist follows manifest array order (plan order) — stable, intentional sequencing
- Fallback body format (missing summary fields) includes phase badge and feature checklist even without summary text — richer than current stub, shows progress dashboard regardless

## Testing Decisions

- Test body formatting logic with various manifest states (no features, partial completion, all done)
- Test ghIssueEdit body parameter passthrough
- Test that missing summary fields produce graceful fallback (richer stub with checklist)
- Test hash-compare short-circuit (same content produces no API call)
- Test feature checklist rendering: with/without issue links, cancelled features excluded, manifest ordering preserved
- Prior art: github-sync.test.ts comprehensive mock infrastructure

## Out of Scope

- Reading artifact files at sync time (summaries stored in manifest instead)
- Syncing artifact file contents directly to GitHub
- GitHub wiki or other documentation targets
- Retroactive enrichment of existing stub issues

## Further Notes

Depends on github-sync-fix PRD being implemented first. The manifest schema change (adding summary and description fields) is additive and backwards-compatible — existing manifests without these fields get the richer fallback format with phase badge and feature checklist.

## Deferred Ideas

- Sync phase transition history to issue comments (e.g., "Advanced to implement with 4 features")
- Attach artifact files as GitHub issue attachments
