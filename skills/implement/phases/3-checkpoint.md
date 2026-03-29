# 3. Checkpoint

## 1. Save Artifact

Always write the implement artifact to `.beastmode/artifacts/implement/YYYY-MM-DD-<design>-<feature-slug>.md`.

The artifact must begin with YAML frontmatter:

```yaml
---
phase: implement
epic: <design>
feature: <feature-slug>
slug: <design>-<feature-slug>
status: completed
---
```

Set `status` to `completed` if all tasks passed, `error` if any task is blocked.

After the frontmatter, write the artifact body:

    # Implementation: <feature-slug>

    **Date:** YYYY-MM-DD
    **Feature Plan:** .beastmode/artifacts/plan/YYYY-MM-DD-<design>-<feature-slug>.md
    **Tasks completed:** N/M

If deviations were tracked during execution, append the deviation log:

    **Deviations:** N total

    ## Auto-Fixed
    - Task N: <description>

    ## Blocking
    - Task N: <description>

    ## Architectural
    - Task N: <description> — User decision: <choice>

If no deviations: append `No deviations — plan executed exactly as written.`

## 2. Phase Retro

@../_shared/retro.md

## 3. Commit and Handoff

Commit all work to the feature branch:

```bash
git add -A
git commit -m "implement(<feature>): checkpoint"
```

```
Next: beastmode validate <slug>
```

STOP. No additional output.
