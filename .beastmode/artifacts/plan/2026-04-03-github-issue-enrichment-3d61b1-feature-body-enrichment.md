---
phase: plan
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment-3d61b1
feature: feature-body-enrichment
wave: 2
---

# Feature Body Enrichment

**Design:** `.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md`

## User Stories

2. As a developer browsing GitHub issues, I want feature bodies to include their user story from the plan, so that I know what each feature implements.
7. As a developer, I want the system to degrade gracefully when artifact paths are missing, so that GitHub sync never fails due to missing content.

## What to Build

Extend feature issue bodies to include the user story text extracted from the feature's plan artifact file.

**FeatureBodyInput Extension:**
- Add an optional `userStory` field (string) to the existing `FeatureBodyInput` interface.
- The user story is the full text content under the `## User Stories` heading in the feature's plan file.

**Body Rendering (body-format.ts):**
- Extend `formatFeatureBody` to render a "User Stories" section between the description and the epic back-reference, if `userStory` is present and non-empty.
- When `userStory` is absent, the body renders exactly as it does today (backward compatible).

**Data Assembly (github-sync.ts):**
- For each feature with a `plan` path in the manifest, use the artifact reader to load the plan file content.
- Use the section splitter to extract the `User Stories` section text.
- Pass the extracted text as the `userStory` field on `FeatureBodyInput`.
- If the plan file is missing or has no User Stories section, omit the field — graceful degradation.

**Unit Tests:**
- body-format: userStory renders when present, omitted when missing, ordering is correct relative to description and epic reference.
- github-sync: verify plan file reading and user story extraction for features, verify graceful degradation when plan file is missing.

## Acceptance Criteria

- [ ] FeatureBodyInput interface extended with optional userStory field
- [ ] formatFeatureBody renders user story section when present
- [ ] Missing userStory produces no output (not empty section)
- [ ] github-sync extracts user story from feature plan file via section splitter
- [ ] Graceful degradation when plan file or User Stories section is missing
- [ ] Existing feature body tests remain green
- [ ] New unit tests cover rendering and extraction paths
