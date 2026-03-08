# status

Show features grouped by current workflow phase.

## Steps

### 1. Scan State Directory

Walk `.beastmode/state/` subdirectories (design, plan, implement, validate, release):

```bash
ls .beastmode/state/design/*.md 2>/dev/null
ls .beastmode/state/plan/*.md 2>/dev/null
ls .beastmode/state/validate/*.md 2>/dev/null
ls .beastmode/state/release/*.md 2>/dev/null
```

### 2. Extract Feature Names

For each state file, extract the feature name from the filename pattern `YYYY-MM-DD-<feature>.md`.
Strip date prefix and `.md` suffix. Strip `.tasks.json` suffix for plan task files.

### 3. Determine Current Phase

For each unique feature name, find the most advanced phase with a state file:
- release > validate > plan > design

Features with release artifacts are considered complete — exclude them from the active display.

### 4. Check Active Worktrees

```bash
ls -d .beastmode/worktrees/*/ 2>/dev/null
```

Map worktree directory names to feature names.

### 5. Display Output

Group features by their current phase:

```
## Active Features

### Design
- <feature> (worktree: .beastmode/worktrees/<feature>)

### Plan
- <feature>

### Implement
- <feature> (worktree: .beastmode/worktrees/<feature>)

### Validate
- <feature>
```

If no active features, display: "No active features."
