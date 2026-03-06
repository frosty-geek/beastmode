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

## 2. Prepare Environment

```bash
# Install dependencies if needed
npm install  # or appropriate command
```

## 3. Load Task State

Read `.agents/plan/YYYY-MM-DD-<feature>.tasks.json` to resume from last completed task.

## 4. Execute Tasks

For each task in the plan:

1. Read task details
2. Execute each step
3. Mark task complete in TodoWrite
4. Update tasks.json status

## 5. Task Execution Pattern

```
For each task:
  Read files listed
  Execute steps in order
  Run verification command
  Mark complete
```

## 6. Error Handling

If a step fails:
- Stop and report the error
- Do NOT proceed to next task
- Suggest fix or ask for guidance
