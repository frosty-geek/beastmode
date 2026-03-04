# /validate Command

Quality gate before release.

## Reads
- `.beastmode/context/VALIDATE.md` (L1)
- `.beastmode/meta/VALIDATE.md` (L1)
- `.beastmode/state/implement/{feature}.md`

## Writes
- `.beastmode/state/validate/YYYYMMDD-{feature}.md`

## Flow
1. Load context and meta
2. Read implement state
3. Run tests
4. Check quality gates
5. Move state from implement/ to validate/
