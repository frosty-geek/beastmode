# /release Command

Ship validated code.

## Reads
- `.beastmode/context/RELEASE.md` (L1)
- `.beastmode/meta/RELEASE.md` (L1)
- `.beastmode/state/validate/{feature}.md`

## Writes
- `.beastmode/state/release/YYYYMMDD-{feature}.md`

## Anatomy

All workflow phases follow the same sub-phase pattern:

| Sub-Phase | Purpose |
|-----------|---------|
| 0-prime | Load context, research if needed |
| 1-execute | Do the actual work |
| 2-validate | Check work, approval gates |
| 3-checkpoint | Save artifacts, capture learnings |

## Flow
1. **0-prime**: Load artifacts, analyze changes
2. **1-execute**: Generate changelog, create commit
3. **2-validate**: Check merge readiness
4. **3-checkpoint**: Merge to main, cleanup worktree, final retro
