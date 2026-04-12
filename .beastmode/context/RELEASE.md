# Release Context

## Versioning
- ALWAYS use squash merge for releases — one commit per version on main
- ALWAYS archive feature branch tips as `archive/feature/<name>` before deletion
- ALWAYS follow commit format: `Release vX.Y.Z — Title` with categorized sections

## Release Process
- ALWAYS bump versions and update CHANGELOG on main AFTER the squash merge — never in the worktree
- ALWAYS resolve version file and CHANGELOG conflicts with --ours (main) during squash merge
- NEVER modify version files (plugin.json, marketplace.json) or CHANGELOG.md in the worktree
- ALWAYS run retro inlined in the release skill — no shared orchestrator import
- ALWAYS use context walker as the sole retro agent — meta walker removed
- ALWAYS run retro with all phase artifacts (design, plan, implement, validate, release) in a single pass

## Changelog
- ALWAYS include Highlights and Full Changelog sections in release artifacts
- ALWAYS categorize changes as Features, Fixes, Docs, or Chores
- ALWAYS maintain consolidated CHANGELOG.md at repo root
- NEVER include empty category sections — only sections with content
