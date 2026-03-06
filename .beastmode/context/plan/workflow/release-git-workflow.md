# Release Git Workflow

## Context
Regular merge preserved full branch history on main, creating noisy git logs.

## Decision
Releases use `git merge --squash` to collapse feature branches into one commit per version on main. Feature branch tips archived as `archive/feature/<name>` tags before deletion. Commit messages use GitHub release style with Features/Fixes/Artifacts sections.

## Rationale
One commit per version on main makes git log scannable. Archive tags preserve full branch history for forensics. GitHub release style provides structured changelogs.

## Source
state/plan/2026-03-05-squash-per-release.md
