# /implement Command

Execute implementation plan.

## Reads
- `.beastmode/context/IMPLEMENT.md` (L1)
- `.beastmode/meta/IMPLEMENT.md` (L1)
- `.beastmode/state/plan/{feature}.md`

## Writes
- `.beastmode/state/implement/YYYYMMDD-{feature}.md`

## Flow
1. Load context and meta
2. Read plan state
3. Execute tasks
4. Move state from plan/ to implement/
