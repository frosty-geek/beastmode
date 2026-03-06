# 1. Execute

## 1. Enter Feature Worktree

**MANDATORY — do not skip this step.**

Read the worktree path from the status file and `cd` into it:

```bash
status_file=".agents/status/YYYY-MM-DD-<feature>.md"
# Extract path from "## Worktree" section
worktree_path=$(grep -A1 "^## Worktree" "$status_file" | grep "Path:" | sed 's/.*Path:\s*//' | tr -d '`')
cd "$worktree_path"
pwd  # confirm you are in the worktree
```

If the worktree path is missing from the status file or the directory doesn't exist, STOP and tell the user — do not continue on main.

See @../_shared/worktree-manager.md for full reference.

## 2. Explore Codebase

Understand:
- Existing patterns and conventions
- Files that will be touched
- Test structure and commands
- Dependencies and build tools

## 3. Create Plan Header

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

**Design Doc:** [Link to .beastmode/state/design/ doc]

---
```

## 4. Write Tasks

For each component in the design, create a task:

```markdown
## Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.ext`
- Modify: `exact/path/to/existing.ext`
- Delete: `exact/path/to/remove.ext`

**Step 1: [Action]**

[Exact code or command]

**Step 2: [Action]**

[Exact code or command]

**Step N: Verify**

Run: `[verification command]`
Expected: [expected output]
```

## 5. Task Guidelines

- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant docs/designs with links
- DRY, YAGNI principles
