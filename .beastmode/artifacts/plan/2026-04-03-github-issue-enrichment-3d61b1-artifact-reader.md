---
phase: plan
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment
feature: artifact-reader
wave: 1
---

# Artifact Reader

**Design:** `.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md`

## User Stories

7. As a developer, I want the system to degrade gracefully when artifact paths are missing, so that GitHub sync never fails due to missing content.

## What to Build

A pure utility module that extracts named sections from markdown artifact files and resolves artifact file paths. This module has no GitHub or manifest-mutation logic — it reads files and returns structured data.

**Section Splitter**

A regex-based splitter that breaks markdown content on `## ` heading boundaries. Given a markdown string, it produces a map of heading names to section bodies. This handles the controlled heading structure of PRD and plan templates without requiring a full markdown AST library.

The splitter must handle edge cases: missing sections return undefined (not empty strings), sections with no content between headings, and headings at different depths (only `## ` level-2 headings are split boundaries).

**Artifact Path Resolution**

A resolver that locates artifact files for a given phase and slug. It checks `manifest.artifacts[phase]` first for pre-recorded paths. If no manifest entry exists, it falls back to scanning `artifacts/{phase}/` with a slug-based glob pattern. If neither produces a result, it returns undefined — never throws.

**Orchestrating Read**

A higher-level function that combines path resolution and section extraction: given a phase and slug, it finds the artifact file, reads it, splits sections, and returns the result. If any step fails (missing file, unreadable content, no matching sections), it returns undefined and logs a warning.

All functions are pure or effectful-but-safe (file reads only, no writes, no mutations). The module is independently testable with fixture markdown files.

## Acceptance Criteria

- [ ] Section splitter correctly extracts named `## ` sections from well-formed markdown
- [ ] Section splitter returns undefined for missing sections (not empty string, not throw)
- [ ] Section splitter handles edge cases: empty sections, consecutive headings, content before first heading
- [ ] Artifact path resolver checks manifest.artifacts first, then falls back to glob scan
- [ ] Artifact path resolver returns undefined when no artifact exists (never throws)
- [ ] Orchestrating read function chains resolution + read + split with full graceful degradation
- [ ] Unit tests cover: normal extraction, missing sections, missing files, manifest-first resolution, glob fallback, malformed markdown
