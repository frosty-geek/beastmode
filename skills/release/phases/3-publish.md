# 3. Publish

## 1. Commit Changes

```bash
git add .agents/release/YYYY-MM-DD-<version>.md
git add CHANGELOG.md  # if updated
git commit -m "docs(release): add <version> release notes"
```

## 2. Suggest Next Steps

Provide commands for:
- Creating git tag: `git tag -a v<version> -m "Release <version>"`
- Pushing tag: `git push origin v<version>`
- Creating GitHub release (if applicable)

## 3. Session Tracking

@../_shared/session-tracking.md

## 4. Context Report

@../_shared/context-report.md
