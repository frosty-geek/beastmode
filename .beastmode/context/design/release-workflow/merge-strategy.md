# Merge Strategy

## Context
Need to decide how feature branches merge back to main without losing history or creating messy commit logs.

## Decision
Merge-only with squash. Archive branch tips before deletion with `archive/feature/<name>` tags. Interactive merge options: merge locally (recommended), push and create PR, keep as-is, discard.

## Rationale
- Squash merge produces one clean commit per release on main
- Archive tags preserve the full branch history for forensics
- Interactive options accommodate different team workflows

## Source
state/design/2026-03-04-release-merge-fix.md
state/design/2026-03-05-squash-per-release.md
