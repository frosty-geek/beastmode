# Commit Refs on Release

## Context
Release squash-merge collapses all per-phase commits into one commit on main. The question is which issue refs should appear on this commit.

## Decision
Release squash-merge commit includes epic ref (`Refs #<epic>`) only. Feature refs are excluded.

## Rationale
- Feature refs already exist on per-checkpoint commits in the archived feature branch — `git tag archive/feature/<name>` preserves this history
- Including feature refs on the squash-merge would duplicate linkage that is already preserved in the archive
- Epic ref on the squash-merge creates a clean one-commit-to-one-epic association on main
- Consistent with the two-level hierarchy: main branch tracks epics, feature branches track features

## Source
`.beastmode/artifacts/design/2026-03-31-commit-issue-refs.md`
