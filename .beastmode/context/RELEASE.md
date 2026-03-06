# Release Context

Release workflow and versioning conventions. Squash-per-release commits: `git merge --squash` collapses feature branches into one commit on main with GitHub release style messages (`Release vX.Y.Z — Title`). Feature branch tips preserved via archive tags. Merge-only strategy (rebase dropped in v0.6.1). Handles version detection, commit categorization, changelog generation, marketplace updates, worktree merge/cleanup, and retro capture.

## Versioning
Versioning strategy, commit message format, and archive tagging conventions. Version sourced from plugin.json. Minor bumps for new capabilities, patch bumps for docs/polish/fixes. Commits follow `Release vX.Y.Z — Title` with em dash. Archive tags preserve branch history.

1. ALWAYS use squash merge for releases — one commit per version on main
2. ALWAYS archive feature branch tips as `archive/feature/<name>` before deletion
3. ALWAYS follow commit format: `Release vX.Y.Z — Title` with categorized sections
4. NEVER skip retro before the release commit

release/versioning.md

## Release Process
Merge strategy, retro timing, L0 rollup, and version file management. Evolved from rebase-then-merge (v0.3.7) to merge-only (v0.6.1). Retro runs in execute phase before commit. L1 summaries rolled into BEASTMODE.md via L0 proposal at ship time.

1. ALWAYS use merge-only — no rebase before merge
2. ALWAYS run retro in execute phase before the release commit
3. ALWAYS prepare L0 update proposal from L1 summaries at release time (targets BEASTMODE.md)
4. NEVER spread version across more than 3 files (plugin.json, marketplace.json, CHANGELOG.md)

release/release-process.md

## Changelog
Release artifact format, consolidated CHANGELOG.md, and commit categorization conventions. Per-release state docs follow Highlights/Features/Fixes/Full Changelog structure. Consolidated CHANGELOG.md lives at repo root (introduced v0.6.0).

1. ALWAYS include Highlights and Full Changelog sections in release artifacts
2. ALWAYS categorize changes as Features, Fixes, Docs, or Chores
3. ALWAYS maintain consolidated CHANGELOG.md at repo root
4. NEVER include empty category sections — only sections with content

release/changelog.md
