---
phase: plan
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment-3d61b1
feature: epic-body-enrichment
wave: 2
---

# Epic Body Enrichment

**Design:** `.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md`

## User Stories

1. As a developer browsing GitHub issues, I want epic bodies to include PRD summary, user stories, and implementation decisions, so that I can understand the feature without leaving GitHub.
3. As a developer, I want epic issues to link to the full PRD (repo-relative path and GitHub permalink), so that I can access the complete design document.
4. As a developer, I want epic issues to show branch name, phase tags, release version, and merge commit link, so that I can trace code changes back to the feature.
6. As a developer, I want the epic body to be updated at each phase transition with newly available information, so that the issue always reflects the current state of the feature.
7. As a developer, I want the system to degrade gracefully when artifact paths are missing, so that GitHub sync never fails due to missing content.

## What to Build

Extend the epic issue body from a minimal phase badge + feature checklist to a progressively enriched document that grows richer as the epic advances through phases.

**EpicBodyInput Extension:**
- Add optional fields to the existing `EpicBodyInput` interface:
  - `prdSections`: extracted PRD content — problem statement, solution, user stories, implementation decisions (all optional strings).
  - `artifactLinks`: per-phase records containing repo-relative path and GitHub permalink URL (optional array).
  - `gitMetadata`: branch name, phase tag references, release version, merge commit SHA (all optional).
- All new fields are optional. Existing tests remain green because presence-based rendering adds sections only when data exists.

**Body Rendering (body-format.ts):**
- Extend `formatEpicBody` to render new optional sections in a defined order:
  - Phase badge (existing)
  - Problem / Solution (existing via `summary`, now enhanced with full PRD text from `prdSections`)
  - User Stories section (from `prdSections.userStories`)
  - Implementation Decisions section (from `prdSections.decisions`)
  - Artifact Links section (design PRD path, plan artifact path, etc. with permalinks)
  - Git Metadata section (branch, phase tags, version, merge commit)
  - Features checklist (existing)
- Each section is only rendered if its corresponding input field is present and non-empty.

**Data Assembly (github-sync.ts):**
- Before calling `formatEpicBody`, use the section splitter and artifact reader to extract PRD content from the design artifact.
- Resolve git metadata: branch from `manifest.worktree.branch`, phase tags via `git tag -l "beastmode/{slug}/*"`, version from `plugin.json` or manifest, merge commit from git log.
- Build permalink URLs using the phase tag SHA as the commit anchor and the repo-relative artifact path.
- Assemble all available data into the extended `EpicBodyInput`. Missing data is simply omitted — presence-based rendering handles the rest.
- This assembly runs on every sync call. The existing `bodyHash` mechanism prevents redundant GitHub API calls when nothing has changed.

**Progressive Enrichment:**
- After design: PRD sections (problem, solution, user stories, decisions) + design artifact link become available.
- After plan: plan artifact link is added.
- After implement/validate: phase tags accumulate.
- After release: version, merge commit, and release tag are added.
- Each phase transition triggers a sync that assembles whatever data is currently available.

**Unit Tests:**
- body-format: new sections render when present, are omitted when missing, ordering is correct, progressive enrichment scenarios.
- github-sync integration: mock artifact files, verify data assembly, verify graceful degradation when artifacts are missing.

## Acceptance Criteria

- [ ] EpicBodyInput interface extended with optional prdSections, artifactLinks, and gitMetadata fields
- [ ] formatEpicBody renders PRD content sections (problem, solution, user stories, decisions) when present
- [ ] formatEpicBody renders artifact links with repo paths and permalinks when present
- [ ] formatEpicBody renders git metadata (branch, tags, version, merge commit) when present
- [ ] Missing fields produce no output (not empty sections)
- [ ] github-sync extracts PRD sections from design artifact via section splitter
- [ ] github-sync resolves git metadata from git state and manifest
- [ ] github-sync builds permalink URLs using phase tag SHAs
- [ ] Existing tests remain green (backward compatible)
- [ ] New unit tests cover all rendering and assembly paths
