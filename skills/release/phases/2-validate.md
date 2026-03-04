# 2. Validate

## 1. Check Merge Readiness

```bash
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
```

## 2. Verify Changelog

- Changelog entry exists?
- Version number correct?
- All changes documented?

## 3. Validation Gate

If issues found:
- Report problems
- Do NOT proceed to merge

If clean:
- Proceed to checkpoint
