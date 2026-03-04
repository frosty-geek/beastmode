# /design Command

Design a feature through collaborative dialogue.

## Reads
- `.beastmode/context/DESIGN.md` (L1)
- `.beastmode/meta/DESIGN.md` (L1)

## Writes
- `.beastmode/state/design/YYYYMMDD-{feature}.md`

## Anatomy

All workflow phases follow the same sub-phase pattern:

| Sub-Phase | Purpose |
|-----------|---------|
| 0-prime | Load context, research if needed |
| 1-execute | Do the actual work |
| 2-validate | Check work, approval gates |
| 3-checkpoint | Save artifacts, capture learnings |

## Flow
1. **0-prime**: Load context, check research triggers, create worktree
2. **1-execute**: Propose approaches, iterate on design
3. **2-validate**: Completeness check, user approval
4. **3-checkpoint**: Write design doc, update status, suggest /plan
