# 3. Checkpoint

## 1. Merge to Main

```bash
git checkout main
git merge <feature-branch> --ff-only
```

## 2. Cleanup Worktree

```bash
git worktree remove <worktree-path>
git branch -d <feature-branch>
```

## 3. Comprehensive Retro

Update all relevant `.beastmode/meta/*.md` files with learnings from the entire cycle.

## 4. Update Status

Mark feature as released in status file.

## 5. Session Tracking

@../_shared/session-tracking.md

## 6. Context Report

@../_shared/context-report.md

## 7. Complete

"Feature released to main. Worktree cleaned up."
