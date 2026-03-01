# Phase 1: Setup (Git Worktree)

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "Setting up isolated worktree for implementation."

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Beastmode uses project-local .agents/worktrees/
ls -d .agents/worktrees 2>/dev/null
```

**If found:** Use that directory.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
grep -i "worktree.*director" .agents/CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Default to .agents/worktrees/

Beastmode convention: all worktrees go in `.agents/worktrees/`

```bash
mkdir -p .agents/worktrees
```

## Safety Verification

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .agents/worktrees 2>/dev/null
```

**If NOT ignored:**

Per beastmode convention - fix broken things immediately:
1. Add `.agents/worktrees/` to .gitignore
2. Commit the change
3. Proceed with worktree creation

**Why critical:** Prevents accidentally committing worktree contents to repository.

## Creation Steps

### 1. Extract Branch Name from Plan

```bash
# From plan filename: 2026-03-01-feature.md → feature
branch_name="implement/$(basename "$PLAN_PATH" .md | sed 's/^[0-9-]*//')"
```

### 2. Detect Project Name

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 3. Create Worktree

```bash
# Full path
path=".agents/worktrees/$branch_name"

# Create worktree with new branch
git worktree add "$path" -b "$branch_name"
cd "$path"
```

### 4. Report Location

```
Worktree ready at <full-path>
Branch: <branch-name>
Ready for Phase 2: Prepare
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.agents/worktrees/` exists | Use it (verify ignored) |
| Directory not ignored | Add to .gitignore + commit |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

## Red Flags

**Never:**
- Create worktree without verifying it's ignored
- Work on main/master branch directly

**Always:**
- Use `.agents/worktrees/` for beastmode projects
- Verify directory is ignored for project-local

## Exit Criteria

✓ Worktree created at `.agents/worktrees/<branch-name>/`
✓ Branch created: `implement/<feature-name>`
✓ Directory verified as gitignored

**On success:** Proceed to Phase 2: Prepare
**On failure:** Stop and ask for help
