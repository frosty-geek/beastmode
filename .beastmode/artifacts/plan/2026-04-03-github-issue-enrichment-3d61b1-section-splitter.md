---
phase: plan
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment
feature: section-splitter
wave: 1
---

# Section Splitter

**Design:** `.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md`

## User Stories

1. As a developer browsing GitHub issues, I want epic bodies to include PRD summary, user stories, and implementation decisions, so that I can understand the feature without leaving GitHub.
2. As a developer browsing GitHub issues, I want feature bodies to include their user story from the plan, so that I know what each feature implements.
7. As a developer, I want the system to degrade gracefully when artifact paths are missing, so that GitHub sync never fails due to missing content.

## What to Build

A markdown section extraction utility that splits artifact files by `## ` headings and returns named sections. This is the shared foundation for all body enrichment features.

**Section Splitter Module:**
- A pure function that takes raw markdown content and returns a map of section heading → section body text.
- Splits on `## ` heading markers (level-2 headings only). Each section includes the content between its heading and the next heading (or end of file).
- Heading names are normalized (trimmed, case-preserved) as map keys.
- Returns an empty map for empty/undefined input — never throws.
- Lives in its own module alongside body-format (pure, no filesystem imports).

**Artifact Reader Helper:**
- A function in the github-sync layer that reads an artifact file from disk given a path, returning the raw markdown content.
- Uses `manifest.artifacts` record to find artifact paths by phase. Falls back to glob scanning `artifacts/{phase}/` by slug pattern if manifest path is missing.
- Returns `undefined` when the artifact file doesn't exist — callers skip enrichment gracefully.
- This helper is the single point of filesystem access for artifact content; body-format never touches the filesystem.

**Unit Tests:**
- Section splitter: extraction of named sections, handling of missing sections, empty input, headings with no content, multiple headings at same level.
- Artifact reader: successful reads, missing files return undefined, glob fallback behavior.

## Acceptance Criteria

- [ ] Section splitter extracts named `## ` sections from markdown content into a heading→body map
- [ ] Empty or undefined input returns empty map without throwing
- [ ] Artifact reader resolves paths from manifest.artifacts with glob fallback
- [ ] Artifact reader returns undefined for missing files (graceful degradation)
- [ ] Unit tests cover extraction, edge cases, and degradation paths
