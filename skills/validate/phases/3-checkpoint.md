# 3. Checkpoint

## 1. Save Report

Save to `.beastmode/state/validate/YYYY-MM-DD-<feature>.md` where `<feature>` is the epic slug.

## 2. Phase Retro

@../_shared/retro.md

## 3. Commit and Handoff

If FAIL:
```
Validation failed. Fix issues and re-run:
beastmode validate <feature>
```
STOP — do not proceed to commit.

If PASS:

Commit all work to the feature branch:

```bash
git add -A
git commit -m "validate(<feature>): checkpoint"
```

Print:

```
Next: beastmode release <feature>
```

STOP. No additional output.
