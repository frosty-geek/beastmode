# Changelog Generation

## Context
Need human-readable release notes that categorize changes by type.

## Decision
Format: version + title + date. Commits categorized by conventional commit prefix (feat, fix, refactor, etc.). CHANGELOG.md at repo root.

## Rationale
- Conventional commit categorization provides automatic structure
- Repo root placement makes changelog discoverable
- Version + title + date format matches GitHub release conventions

## Source
state/design/2026-03-04-changelog.md
