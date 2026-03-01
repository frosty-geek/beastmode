# 3. Document and Handoff

## 1. Write Design Doc

Save to `.agents/design/YYYY-MM-DD-<topic>.md`

Include:
- Goal statement
- Approach summary
- Key decisions
- Component breakdown
- Testing strategy

## 2. Commit

```bash
git add .agents/design/YYYY-MM-DD-<topic>.md
git commit -m "docs(design): add <topic> design"
```

## 3. Suggest Next Step

Provide copy-pasteable command:

```
/plan .agents/design/YYYY-MM-DD-<topic>.md
```

The terminal state is suggesting /plan. Do NOT invoke any implementation skill.

## 4. Session Tracking

@../_shared/session-tracking.md

## 5. Context Report

@../_shared/context-report.md
