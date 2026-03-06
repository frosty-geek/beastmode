# Release Context

Release workflow and versioning conventions. The /release skill uses squash-per-release commits: `git merge --squash` collapses feature branches into one commit on main with GitHub release style messages (`Release vX.Y.Z — Title`). Feature branch tips are preserved via archive tags (`archive/feature/<name>`). Handles version detection from plugin.json, commit categorization for changelog generation, plugin marketplace updates, worktree merge and cleanup, BEASTMODE.md rollup, and retro capture before commit.

## Versioning
Versioning strategy, commit message format, and archive tagging conventions.
release/versioning.md
