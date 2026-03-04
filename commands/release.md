# /release Command

Ship validated code.

## Reads
- `.beastmode/context/RELEASE.md` (L1)
- `.beastmode/meta/RELEASE.md` (L1)
- `.beastmode/state/validate/{feature}.md`

## Writes
- `.beastmode/state/release/YYYYMMDD-{feature}.md`

## Flow
1. Load context and meta
2. Read validate state
3. Commit changes
4. Generate changelog
5. Move state from validate/ to release/
