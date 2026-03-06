# Release Process

Mechanics of how a release is executed. Covers merge strategy, retro timing, L0 rollup (BEASTMODE.md), and version file management. These patterns evolved significantly during the v0.3.x-v0.6.x period and stabilized by v0.7.0.

## Merge Strategy
Squash merge onto main with no rebase. Originally (v0.3.7) added a rebase-sync step before merging; v0.6.1 dropped rebase entirely because per-commit replay caused constant conflicts. Current approach: `git merge --squash` directly, resolve conflicts once.

1. ALWAYS use `git merge --squash` to collapse feature branch into one commit on main
2. NEVER rebase feature branch onto main before merging
3. Merge resolves conflicts once instead of per-commit replay

## Retro Timing
Phase retro runs in the execute phase (step 8) before the release commit (step 9), not in the checkpoint phase. This ensures retro output gets included in the unified release commit, preventing untracked meta files.

1. ALWAYS run retro before the release commit in execute phase
2. NEVER run retro in checkpoint for release (already executed in execute)

## Release Rollup
At release time, L1 summaries are rolled up into an L0 update proposal targeting BEASTMODE.md. Introduced in v0.5.2, originally targeting PRODUCT.md (deleted in v0.14.x hierarchy-cleanup, content merged into context/DESIGN.md). Retro bubble scoped to L2->L1 only (not L0). BEASTMODE.md gains updated Capabilities/How It Works sections via the L0 proposal mechanism.

1. ALWAYS prepare L0 update proposal from L1 summaries at release time
2. Retro bubble propagates L2 -> L1 only; L0 updated at release time via proposal

## Version File Management
Version lives in 3 files: plugin.json (source of truth), marketplace.json, and CHANGELOG.md. Reduced from 5 files in v0.6.1 by removing version from README badge and PRODUCT.md.

1. ALWAYS treat plugin.json as the version source of truth
2. ALWAYS update: plugin.json, marketplace.json, CHANGELOG.md
3. NEVER embed version in README or PRODUCT.md
