# Phase 1: Setup (Git Worktree)

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "Setting up isolated worktree for implementation."

## Directory Selection Process

Follow this priority order:

### 1. Check Existing Directories

```bash
# Beastmode uses project-local .agent/worktrees/
ls -d .agent/worktrees 2>/dev/null
```

**If found:** Use that directory.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
grep -i "worktree.*director" .agent/CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Default to .agent/worktrees/

Beastmode convention: all worktrees go in `.agent/worktrees/`

```bash
mkdir -p .agent/worktrees
```

## Safety Verification

**MUST verify directory is ignored before creating worktree:**

```bash
# Check if directory is ignored (respects local, global, and system gitignore)
git check-ignore -q .agent/worktrees 2>/dev/null
```

**If NOT ignored:**

Per beastmode convention - fix broken things immediately:
1. Add `.agent/worktrees/` to .gitignore
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
path=".agent/worktrees/$branch_name"

# Create worktree with new branch
git worktree add "$path" -b "$branch_name"
cd "$path"
```

### 4. Run Project Setup

Auto-detect and run appropriate setup:

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 5. Verify Clean Baseline

Run tests to ensure worktree starts clean:

```bash
# Examples - use project-appropriate command
npm test
cargo test
pytest
go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.

**If tests pass:** Report ready.

### 6. Report Location

```
Worktree ready at <full-path>
Branch: <branch-name>
Tests passing (<N> tests, 0 failures)
Ready for Phase 2: Prepare
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| `.agent/worktrees/` exists | Use it (verify ignored) |
| Directory not ignored | Add to .gitignore + commit |
| Tests fail during baseline | Report failures + ask |
| No package.json/Cargo.toml | Skip dependency install |

## Common Mistakes

### Skipping ignore verification

- **Problem:** Worktree contents get tracked, pollute git status
- **Fix:** Always use `git check-ignore` before creating project-local worktree

### Proceeding with failing tests

- **Problem:** Can't distinguish new bugs from pre-existing issues
- **Fix:** Report failures, get explicit permission to proceed

### Hardcoding setup commands

- **Problem:** Breaks on projects using different tools
- **Fix:** Auto-detect from project files (package.json, etc.)

## Red Flags

**Never:**
- Create worktree without verifying it's ignored
- Skip baseline test verification
- Proceed with failing tests without asking
- Work on main/master branch directly

**Always:**
- Use `.agent/worktrees/` for beastmode projects
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Exit Criteria

✓ Worktree created at `.agent/worktrees/<branch-name>/`
✓ Branch created: `implement/<feature-name>`
✓ Dependencies installed (if applicable)
✓ Tests pass (or explicit permission to proceed)

**On success:** Proceed to Phase 2: Prepare
**On failure:** Stop and ask for help
