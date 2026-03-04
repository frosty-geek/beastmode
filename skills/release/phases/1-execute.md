# 1. Execute

## 1. Generate Changelog Entry

Based on commits and artifacts, generate:

```markdown
## [version] - YYYY-MM-DD

### Added
- {new features}

### Changed
- {modifications}

### Fixed
- {bug fixes}
```

## 2. Stage All Changes

```bash
git add -A
```

## 3. Create Unified Commit

```bash
git commit -m "feat(<feature>): <summary>

<detailed description>

Design: .agents/design/YYYY-MM-DD-<feature>.md
Plan: .agents/plan/YYYY-MM-DD-<feature>.md
"
```
