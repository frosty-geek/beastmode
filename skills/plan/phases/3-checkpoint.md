# 3. Checkpoint

## 0. Assert Worktree

Before any writes, call [worktree-manager.md](../_shared/worktree-manager.md) → "Assert Worktree". If it fails, STOP.

## 1. Write Feature Plan Files

For each feature, save to `.beastmode/state/plan/YYYY-MM-DD-<design>-<feature-slug>.md` using the template from [feature-format.md](../references/feature-format.md).

Where `<design>` is the worktree directory name (from "Derive Feature Name") and `<feature-slug>` is the feature's name slug.

## 2. Write Manifest

Save to `.beastmode/state/plan/YYYY-MM-DD-<design>.manifest.json`:

```json
{
  "design": ".beastmode/state/design/YYYY-MM-DD-<design>.md",
  "architecturalDecisions": [
    {"decision": "<description>", "choice": "<choice>"}
  ],
  "features": [
    {
      "slug": "<feature-slug>",
      "plan": "YYYY-MM-DD-<design>-<feature-slug>.md",
      "status": "pending"
    }
  ],
  "lastUpdated": "<ISO-8601-timestamp>"
}
```

## 3. Phase Retro

@../_shared/retro.md

## 4. [GATE|transitions.plan-to-implement]

Read `.beastmode/config.yaml` → resolve mode for `transitions.plan-to-implement`.
Default: `human`.

<HARD-GATE>
DO NOT call EnterPlanMode or ExitPlanMode.
</HARD-GATE>

### [GATE-OPTION|human] Suggest Next Step

Print features and their implement commands:

```
Features ready for implementation:

1. <feature-1> → `/beastmode:implement <design>-<feature-1>`
2. <feature-2> → `/beastmode:implement <design>-<feature-2>`
```

STOP. No additional output.

### [GATE-OPTION|auto] Chain to Next Phase

Call `Skill(skill="beastmode:implement", args="<design>-<first-feature>")` for the first feature only. User runs subsequent features manually.
