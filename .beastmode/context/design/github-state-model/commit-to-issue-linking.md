# Commit-to-Issue Linking

## Context
GitHub's one-way mirror model syncs labels and board state, but commits on the feature branch have no linkage to the issues they serve. Issue timelines show label changes but not implementation progress.

## Decision
Checkpoint commits include `Refs #N` lines referencing the epic issue (always) and the feature issue (at implement fan-out). Release squash-merge includes epic ref only. `Refs` keyword is used, never `Closes` or `Fixes`.

## Rationale
- `Refs` was chosen over `Closes`/`Fixes` because checkpoint commits should not auto-close issues — only the release phase closes epics
- Epic ref is always included because every checkpoint is work toward the epic, regardless of phase
- Feature ref is included only at implement because other phases (plan, validate, release) operate at epic granularity
- Release squash-merge excludes feature refs because feature branches are archived and their per-checkpoint refs are already in the archived branch history — duplicating them on main adds noise
- This extends the one-way mirror model: GitHub shows not just label state but also commit activity in issue timelines

## Source
`.beastmode/artifacts/design/2026-03-31-commit-issue-refs.md`
