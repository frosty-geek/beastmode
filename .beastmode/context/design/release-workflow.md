# Release Workflow

## Version Detection
- ALWAYS use plugin.json as version source of truth — not package.json or tags
- NEVER bump version without conventional commit evidence — traceability

## Commit Sequence
- ALWAYS run retro before the release commit — ensures meta changes are included
- NEVER make interim commits during design/plan/implement — all commits deferred to release
- ALWAYS use GitHub release style commit messages — consistency
- Sync with main, bump versions in plugin.json/marketplace.json/session-start.sh, squash-merge — full sequence

## Changelog Generation
- ALWAYS categorize by conventional commit prefix (feat, fix, refactor, etc.) — scannable history
- Format: version + title + date — standardized entries

## Merge Strategy
- ALWAYS archive branch tip before squash merge — `git tag archive/feature/<name>` preserves history
- NEVER rebase at merge time — merge-only strategy avoids per-commit conflicts
- Interactive merge options: merge locally (recommended), push and create PR, keep as-is, discard — user choice
