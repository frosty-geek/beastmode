# Design: Rename .agent to .agents

**Date:** 2026-03-01
**Status:** Approved

## Overview

Rename the `.agent` directory to `.agents` across the entire beastmode codebase, including all references in documentation and configuration files.

## Motivation

Consistency and clarity — `.agents` better reflects that the folder contains artifacts and configuration for multiple agents.

## Approach

**Big Bang (Option A):** Atomic rename with single commit.

## Implementation

### Step 1: Directory Rename

```bash
mv .agent .agents
```

Includes all subdirectories:
- `.agents/prime/` (META, STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING, AGENTS)
- `.agents/design/`, `.agents/plan/`, `.agents/release/`, `.agents/research/`, `.agents/status/`, `.agents/verify/`
- `.agents/worktrees/`
- `.agents/CLAUDE.md`, `.agents/.gitignore`

### Step 2: File Content Updates

Global find-replace `.agent` → `.agents` in 36 files (213 occurrences):

| Category | Files |
|----------|-------|
| Root | `CLAUDE.md`, `README.md`, `.gitignore` |
| Skills | 14 SKILL.md files across all skills |
| Templates | `skills/bootstrap/templates/*.md` |
| Prime docs | `.agents/prime/*.md` |
| Existing artifacts | `.agents/design/*.md`, `.agents/plan/*.md` |
| Implement phases | `skills/implement/phases/*.md` |
| Agent definitions | `agents/discovery.md` |

### Step 3: Verification

1. `grep -r "\.agent[^s]" .` — must return zero matches
2. `grep -r "\.agent$" .` — must return zero matches
3. Confirm `.agent/` directory no longer exists
4. Confirm `.agents/` directory exists with all subdirectories

### Step 4: Commit

Single atomic commit:
```
refactor: rename .agent to .agents
```

## Edge Cases

- Handle `.agent/` (with trailing slash) and `.agent` (without)
- Update paths in code blocks and inline references
- Update explanatory prose mentioning `.agent`

## Next Steps

Run `/plan` to create implementation tasks:

```
/plan .agents/design/2026-03-01-agent-to-agents-rename.md
```
