---
phase: release
slug: github-issue-enrichment
bump: minor
---

# Release: github-issue-enrichment

**Bump:** minor
**Date:** 2026-03-31

## Highlights

GitHub issues are no longer stub placeholders. Epic issues now display a phase badge, problem statement, solution summary, and a feature checklist with completion status. Feature issues show their plan description with an epic back-reference. Body updates use hash-compare to avoid redundant API calls.

## Features

- Body formatting for epic issues: phase badge, problem/solution text, feature checklist with `[x]`/`[ ]` and `#N` links
- Body formatting for feature issues: description text, epic back-reference
- Manifest summary fields: `summary` (problem + solution) on `PipelineManifest`, `description` on `ManifestFeature`
- Design checkpoint populates manifest summary; plan checkpoint populates feature descriptions
- Sync body update: `ghIssueEdit` accepts optional `body` param, formats and writes on every sync pass
- Hash-compare short-circuit: `github.bodyHash` stores last-written hash, skips API call when content unchanged
- Graceful fallback: missing summary fields still produce richer body (phase badge + checklist) instead of stub
- Cancelled features excluded from checklist; manifest array order preserved

## Full Changelog

- `8a66779` design(github-issue-enrichment): checkpoint
- `daf0b37` plan(github-issue-enrichment): checkpoint
- `321d481` implement(body-formatting): checkpoint
- `e5b6c91` implement(manifest-summary): checkpoint
- `9fe6e98` implement(sync-body-update): checkpoint
- `2738693` validate(github-issue-enrichment): checkpoint
- `2ceb352` validate(github-issue-enrichment): checkpoint
- `28c337d` validate(github-issue-enrichment): checkpoint
- `4b0299f` release(github-issue-enrichment): checkpoint
