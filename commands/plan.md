# /plan Command

Create implementation plan from design.

## Reads
- `.beastmode/context/PLAN.md` (L1)
- `.beastmode/meta/PLAN.md` (L1)
- `.beastmode/state/design/{feature}.md`

## Writes
- `.beastmode/state/plan/YYYYMMDD-{feature}.md`

## Flow
1. Load context and meta
2. Read design state
3. Break into tasks
4. Write plan
5. Move state from design/ to plan/
