# 3. Checkpoint

## 1. Save Report

Save to `.beastmode/state/validate/YYYY-MM-DD-<feature>.md` where `<feature>` is the epic slug.

## 2. Sync GitHub

Read `.beastmode/config.yaml`. If `github.enabled` is `false` or missing, or the manifest has no `github` block, **skip this step entirely**.

When `github.enabled` is `true` and the manifest has `github.epic`:

@../_shared/github.md

Use warn-and-continue for all GitHub calls (see Error Handling Convention in github.md).

1. **Advance Epic Phase** — set the Epic's phase label to `phase/validate` (safety net — implement may have already done this):

```bash
gh issue edit <epic-number> --remove-label "phase/implement" --add-label "phase/validate"
```

2. **Add Epic to Project** — call the "Add to Project + Set Status" operation from github.md with the epic URL and status `"Validate"`.

If the label is already set, this is a no-op. If GitHub sync fails, continue — the validate report is the authority.

## 3. Phase Retro

@../_shared/retro.md

## 4. Commit and Handoff

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
