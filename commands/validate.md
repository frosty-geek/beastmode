# /validate Command

Quality gate before release.

## Reads
- `.beastmode/context/VALIDATE.md` (L1)
- `.beastmode/meta/VALIDATE.md` (L1)
- `.beastmode/state/implement/{feature}.md`

## Writes
- `.beastmode/state/validate/YYYYMMDD-{feature}.md`

## Anatomy

All workflow phases follow the same sub-phase pattern:

| Sub-Phase | Purpose |
|-----------|---------|
| 0-prime | Load context, research if needed |
| 1-execute | Do the actual work |
| 2-validate | Check work, approval gates |
| 3-checkpoint | Save artifacts, capture learnings |

## Flow
1. **0-prime**: Load context, identify test strategy
2. **1-execute**: Run tests, lint, type checks
3. **2-validate**: Analyze results, determine pass/fail
4. **3-checkpoint**: Save report, suggest /release or fix
