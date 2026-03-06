# Version Detection

## Context
Need automated version bumping based on the nature of changes in a release.

## Decision
Conventional commit parsing determines version bump: feat = minor, fix = patch, breaking = major. `plugin.json` is the source of truth for current version. Version bumped in plugin.json, marketplace.json, and session-start.sh.

## Rationale
- Conventional commits provide structured signal for version decisions
- Single source of truth (plugin.json) prevents version drift across files
- Automated detection removes human guesswork from versioning

## Source
state/design/2026-03-04-release-skill-restore.md
state/design/2026-03-04-release-version-sync.md
