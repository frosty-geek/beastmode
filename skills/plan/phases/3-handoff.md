# 3. Handoff

## 1. Ask User

<HARD-GATE>
STOP. You are about to complete the plan. DO NOT call EnterPlanMode or ExitPlanMode. DO NOT automatically start implementation.
</HARD-GATE>

Your ONLY permitted next action is calling `AskUserQuestion`:

```yaml
AskUserQuestion:
  question: "Plan complete and saved. Ready to continue with implementation?"
  header: "Next Step"
  options:
    - label: "Yes, continue with /implement"
      description: "I'll run /implement to execute this plan"
    - label: "No, I'll review first"
      description: "End here, I'll invoke /implement manually when ready"
```

## 2. Print Command

After user responds, print the copy-pasteable command:

```
/implement .agents/plan/YYYY-MM-DD-<feature-name>.md
```

Replace with the actual filename. **Do NOT invoke the skill yourself.**

## 3. Session Tracking

@../_shared/session-tracking.md

## 4. Context Report

@../_shared/context-report.md
