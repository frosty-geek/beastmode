# 3. Apply Changes

## 1. Apply Approved Updates

For each approved change:
- Update the prime file
- Verify the change is correct

## 2. Update CLAUDE.md

If any prime files changed, update the Rules Summary in `.agents/CLAUDE.md` to stay in sync.

## 3. Optional: Engineering Dance Off

For substantial changes, run the deep analysis phase:
- [references/engineering-dance-off.md](../references/engineering-dance-off.md)

## 4. Commit

```bash
git add .agents/prime/
git add .agents/CLAUDE.md
git commit -m "docs(retro): update prime docs from session learnings"
```

## 5. Session Tracking

@../_shared/session-tracking.md

## 6. Context Report

@../_shared/context-report.md
