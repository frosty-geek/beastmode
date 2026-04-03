---
phase: release
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment
bump: minor
---

# Release: github-issue-enrichment-3d61b1

**Version:** v0.70.0
**Date:** 2026-04-03

## Highlights

GitHub issues are no longer hollow shells. Epic and feature issue bodies now progressively fill with PRD content, user stories, artifact links, and full git traceability as epics advance through phases. On release, a closing comment announces the version, tag, and merge commit.

## Features

- Section extractor and splitter for parsing PRD/plan markdown by `##` headings
- Artifact reader resolves design/plan/validate/release artifacts from manifest and slug glob fallback
- Epic body enrichment with PRD sections (problem, solution, user stories, decisions), artifact permalinks, and git metadata
- Feature body enrichment with user stories extracted from plan files
- Release traceability: version, release tag, and merge commit links in epic body
- Release closing comment posted to epic issue on release
- Presence-based rendering: missing fields produce no output, not empty sections
- Graceful degradation when artifact paths are missing

## Fixes

- Updated plan epic frontmatter to match suffixed epic slug

## Full Changelog

- `86cf69a` design(github-issue-enrichment): checkpoint
- `3815633` design(github-issue-enrichment-3d61b1): checkpoint
- `be5dcab` plan(github-issue-enrichment-3d61b1): checkpoint
- `bbecd47` plan(github-issue-enrichment-3d61b1): checkpoint
- `b61d1c6` plan(github-issue-enrichment-3d61b1): checkpoint
- `5444b9c` fix: update plan epic frontmatter to match suffixed epic slug
- `e868133` implement(github-issue-enrichment-3d61b1-sync-body-update): checkpoint
- `001db84` implement(github-issue-enrichment-3d61b1-section-extractor): checkpoint
- `caa3ea7` implement(github-issue-enrichment-3d61b1-section-splitter): checkpoint
- `8c71b2b` implement(github-issue-enrichment-3d61b1-artifact-reader): checkpoint
- `caf81ef` implement(github-issue-enrichment-3d61b1-body-enrichment): checkpoint
- `ec41b6a` implement(github-issue-enrichment-3d61b1-epic-body-enrichment): checkpoint
- `22cad05` implement(github-issue-enrichment-3d61b1-issue-enrichment): checkpoint
- `d924930` implement(github-issue-enrichment-3d61b1-release-traceability): checkpoint
- `3e9ddb1` implement(github-issue-enrichment-3d61b1-release-closing-comment): checkpoint
- `91d7503` implement(github-issue-enrichment-3d61b1-feature-body-enrichment): checkpoint
- `d49e1ce` validate(github-issue-enrichment-3d61b1): checkpoint
