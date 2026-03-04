# /implement Command

Execute implementation plan.

## Reads
- `.beastmode/context/IMPLEMENT.md` (L1)
- `.beastmode/meta/IMPLEMENT.md` (L1)
- `.beastmode/state/plan/{feature}.md`

## Writes
- `.beastmode/state/implement/YYYYMMDD-{feature}.md`

## Anatomy

All workflow phases follow the same sub-phase pattern:

| Sub-Phase | Purpose |
|-----------|---------|
| 0-prime | Load context, research if needed |
| 1-execute | Do the actual work |
| 2-validate | Check work, approval gates |
| 3-checkpoint | Save artifacts, capture learnings |

## Flow
1. **0-prime**: Load plan, enter worktree, prepare environment
2. **1-execute**: Execute tasks, write code
3. **2-validate**: Run tests, check build
4. **3-checkpoint**: Update status, suggest /validate
