# Commit Sequence

## Context
Release requires coordinating version bumps, retro, and merge into a specific order to avoid conflicts and ensure completeness.

## Decision
Sync with main, bump versions in plugin.json/marketplace.json/session-start.sh, run retro before commit, squash-merge to main. No interim commits during feature work — all commits deferred to release. GitHub release style commit messages.

## Rationale
- Retro before commit ensures meta changes are included in the release
- No interim commits keeps the worktree clean and the main branch linear
- Squash merge produces one commit per version on main

## Source
state/design/2026-03-04-release-retro-commit.md
state/design/2026-03-01-unified-cycle-commit.md
