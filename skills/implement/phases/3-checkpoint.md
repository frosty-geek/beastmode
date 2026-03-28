# 3. Checkpoint

## 0. Assert Worktree

Before any writes, call [worktree-manager.md](../_shared/worktree-manager.md) → "Assert Worktree". If it fails, STOP.

## 1. Save Deviation Log

If deviations were tracked during execution, save to `.beastmode/state/implement/YYYY-MM-DD-<design>-<feature-slug>-deviations.md`:

    # Implementation Deviations: <feature-slug>

    **Date:** YYYY-MM-DD
    **Feature Plan:** .beastmode/state/plan/YYYY-MM-DD-<design>-<feature-slug>.md
    **Tasks completed:** N/M
    **Deviations:** N total

    ## Auto-Fixed
    - Task N: <description>

    ## Blocking
    - Task N: <description>

    ## Architectural
    - Task N: <description> — User decision: <choice>

If no deviations, skip this step.

## 2. Update Manifest Status

Read the manifest JSON (resolved in prime). Update the current feature's status to `completed`. Update `lastUpdated` timestamp. Write back.

## 3. Phase Retro

@../_shared/retro.md

## 4. [GATE|transitions.implement-to-validate]

Read `.beastmode/config.yaml` → resolve mode for `transitions.implement-to-validate`.
Default: `human`.

### [GATE-OPTION|human] Suggest Next Step

Check manifest for remaining pending features. Print status:

```
Feature Status:
  ✓ feature-1 — completed
  ○ feature-2 — pending
  ○ feature-3 — pending

Next pending: `/beastmode:implement <design>-<feature-2>`
```

If ALL features completed:
```
All features implemented. Next: `/beastmode:validate <design>`
```

STOP. No additional output.

### [GATE-OPTION|auto] Chain to Next Phase

If pending features remain: call `Skill(skill="beastmode:implement", args="<design>-<next-pending-feature>")`

If ALL features completed: call `Skill(skill="beastmode:validate", args="<design>")`
