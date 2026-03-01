# 1. Analyze Project

## 1. List Project Files

```bash
git ls-files
```

```bash
tree -L 3 -I 'node_modules|__pycache__|.git|dist|build'
```

**Note:** If tree command fails, skip silently and continue.

## 2. Read Core Documentation

Read these files if they exist:
- PRD.md or similar spec file
- CLAUDE.md or similar global rules file
- README files at project root
- Architecture documentation
- Config files (drizzle.config.ts, etc.)

**Fallbacks:**
- No package.json → try pyproject.toml, requirements.txt, Cargo.toml, go.mod
- No PRD.md → try SPEC.md, docs/requirements.md
- No architecture docs → try docs/architecture.md, ARCHITECTURE.md

## 3. Identify Key Files

Find and read key files:
- Main entry points (main.py, index.ts, app.py, server.js)
- Core config files (pyproject.toml, package.json, tsconfig.json)
- Key model/schema definitions
- Important service or controller files

Use Glob to find candidates: `**/*.config.{js,ts}`, `**/main.*`, `**/models/**`

## 4. Check Current State

```bash
git log -10 --oneline
```

```bash
git status
```
