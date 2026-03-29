# 3. Checkpoint

## 1. Phase Retro

@../_shared/retro.md

---

> **TRANSITION BOUNDARY — Steps below operate from main repo, NOT the feature branch working directory.**

## 2. Commit to Feature Branch

Before merging to main, commit all release artifacts to the feature branch:

```bash
git add -A
git commit -m "release(<feature>): checkpoint"
```

## 3. Squash Merge to Main

```bash
feature_dir=$(pwd)
feature_branch=$(git branch --show-current)
main_repo=$(git rev-parse --show-toplevel)/..

cd "$main_repo"
git checkout main
git pull
git tag "archive/$feature_branch"
git merge --squash "$feature_branch"
```

**Important:** The squash merge stages changes but does NOT commit. Proceed to step 5 to create the commit.

## 4. Commit Release

Create the single commit with GitHub release style message:

```bash
git add -A
git commit -m "Release vX.Y.Z — <Title from CHANGELOG>

## Features
- <feature 1>
- <feature 2>

## Fixes
- <fix 1>

## Artifacts
- Design: .beastmode/state/design/YYYY-MM-DD-<feature>.md
- Plan: .beastmode/state/plan/YYYY-MM-DD-<feature>.md
- Release: .beastmode/state/release/YYYY-MM-DD-<feature>.md
"
```

Use the release notes generated in execute step 4 and categorized commits from execute step 3 as the commit body. Omit empty sections (no Fixes if none exist).

## 5. Git Tagging

```bash
git tag -a vX.Y.Z -m "Release X.Y.Z"
```

Suggest: `git push origin vX.Y.Z`

## 6. Plugin Marketplace Update

Suggest running:
```bash
claude plugin marketplace update
claude plugin update beastmode@beastmode-marketplace --scope project
```

## 7. Complete

"Release complete."
