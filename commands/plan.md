# /plan Command

Create implementation plan from design.

## Reads
- `.beastmode/context/PLAN.md` (L1)
- `.beastmode/meta/PLAN.md` (L1)
- `.beastmode/state/design/{feature}.md`

## Writes
- `.beastmode/state/plan/YYYYMMDD-{feature}.md`

## Anatomy

All workflow phases follow the same sub-phase pattern:

| Sub-Phase | Purpose |
|-----------|---------|
| 0-prime | Load context, research if needed |
| 1-execute | Do the actual work |
| 2-validate | Check work, approval gates |
| 3-checkpoint | Save artifacts, capture learnings |

## Flow
1. **0-prime**: Load context, read design doc, enter worktree
2. **1-execute**: Break design into tasks with steps
3. **2-validate**: Completeness check, user approval
4. **3-checkpoint**: Save plan, suggest /implement
