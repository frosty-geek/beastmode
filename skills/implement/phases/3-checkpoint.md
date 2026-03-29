# 3. Checkpoint

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

## 2. Phase Retro

@../_shared/retro.md

## 3. Commit and Handoff

Commit all work to the feature branch:

```bash
git add -A
git commit -m "implement(<feature>): checkpoint"
```

Print:

```
Implementation complete. Next: beastmode implement <design> <next-feature>
```

Or if all features are done:

```
All features implemented. Next: beastmode validate <design>
```

STOP. No additional output.
