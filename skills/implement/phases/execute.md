# Phase 3: Execute (Implementation)

## Overview

Execute tasks in sequence, follow each step exactly, verify at each checkpoint.

**Core principle:** Continuous execution without human checkpoints until blocked.

**Announce at start:** "Executing implementation tasks."

## Execution Loop

For each task in order (respecting blockedBy dependencies):

### Step 1: Mark In Progress

```yaml
TodoWrite:
  todos:
    - content: "Task N: [Name]"
      activeForm: "Implementing [Name]"
      status: in_progress
```

Update `.tasks.json` immediately.

### Step 2: Execute Task Steps

Follow each step in the plan exactly:

1. **Read the step** - understand what needs to be done
2. **Execute** - write code, run command, create file
3. **Verify** - check output matches expected result
4. **Proceed** - move to next step

### Step 3: Run Verification

After completing task steps, run task-specific verification:

```bash
# Run specified tests
pytest tests/path/test.py -v

# Or project-wide
npm test
cargo test
```

### Step 4: Commit (if plan specifies)

Plans typically include commit points. Follow exactly:

```bash
git add <specified-files>
git commit -m "<commit message from plan>"
```

### Step 5: Mark Complete

```yaml
TodoWrite:
  todos:
    - content: "Task N: [Name]"
      activeForm: "Implementing [Name]"
      status: completed
```

Update `.tasks.json` immediately.

### Step 6: Continue

Proceed immediately to next task. Do not wait for human confirmation.

## Handling Failures

### Test Failure

```
Task N verification failed.

Expected: <expected>
Actual: <actual>

[Failure details]

Options:
1. Attempt fix (if obvious)
2. Stop and ask for help
```

If fix is obvious and localized, attempt it. Otherwise STOP.

### Missing Dependency

```
Task N blocked by missing dependency.

Required: <package/file/tool>
Status: Not found

Stopping execution. Please provide:
1. How to install <dependency>
2. Alternative approach
```

STOP immediately. Do not guess.

### Unclear Instruction

```
Task N step unclear.

Step: <step text>
Question: <what's unclear>

Stopping execution. Please clarify.
```

STOP immediately. Ask for clarification.

## Task State Management

### Native Task Tracking

Use TodoWrite for real-time UI feedback:

```yaml
# Current state
TodoWrite:
  todos:
    - content: "Task 0: Setup"
      activeForm: "Setting up"
      status: completed
    - content: "Task 1: Implementation"
      activeForm: "Implementing"
      status: in_progress
    - content: "Task 2: Testing"
      activeForm: "Testing"
      status: pending
```

### Persistent State

Update `.tasks.json` after EVERY status change:

```json
{
  "planPath": ".agent/plan/2026-03-01-feature.md",
  "worktree": ".agent/worktrees/implement/feature",
  "branch": "implement/feature",
  "tasks": [
    {"id": 0, "subject": "Task 0: Setup", "status": "completed"},
    {"id": 1, "subject": "Task 1: Implementation", "status": "in_progress"},
    {"id": 2, "subject": "Task 2: Testing", "status": "pending"}
  ],
  "lastUpdated": "2026-03-01T12:34:56Z"
}
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| Task complete | Mark complete, update JSON, continue |
| Test fails | Attempt obvious fix OR stop |
| Unclear step | STOP, ask for clarification |
| Missing dependency | STOP, ask how to proceed |
| All tasks done | Proceed to Phase 4: Complete |

## Common Mistakes

### Batching task completions

- **Problem:** Progress tracking inaccurate, can't resume correctly
- **Fix:** Update status immediately after each task

### Guessing on failures

- **Problem:** Introduce bugs, waste time on wrong approach
- **Fix:** STOP and ask when blocked

### Skipping verifications

- **Problem:** Broken code makes it to merge
- **Fix:** Run every verification specified in plan

### Not committing at checkpoints

- **Problem:** Lose work, can't bisect issues
- **Fix:** Commit at every checkpoint in plan

## Red Flags

**Never:**
- Skip task verifications
- Continue when blocked
- Batch status updates
- Commit outside plan-specified points
- Work outside the worktree

**Always:**
- Execute steps exactly as written
- Verify after each task
- Update status immediately
- Commit at specified checkpoints
- Stop when unclear

## Exit Criteria

✓ All tasks marked complete
✓ All verifications pass
✓ All commits made per plan
✓ Final test suite passes
✓ Task state persisted

**On success:** Proceed to Phase 4: Complete
**On failure:** Stop and ask for help
