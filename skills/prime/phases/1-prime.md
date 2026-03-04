# 1. Prime

## 1. Check for Beastmode Bootstrap

Check if `.beastmode/` directory exists.

**If missing:**
```
Print: "No .beastmode/ found. Run `/bootstrap` to initialize."
```
Stop execution.

**If exists:** Continue.

## 2. Load Product Context (L0)

Read the product definition:
- `.beastmode/PRODUCT.md`

**If missing:** Print warning and continue.

## 3. Load Context L1 Files

Read all context files (skip silently if missing):
- `.beastmode/context/DESIGN.md`
- `.beastmode/context/PLAN.md`
- `.beastmode/context/IMPLEMENT.md`
- `.beastmode/context/VALIDATE.md`
- `.beastmode/context/RELEASE.md`

## 4. Load Meta L1 Files

Read all meta files (skip silently if missing):
- `.beastmode/meta/DESIGN.md`
- `.beastmode/meta/PLAN.md`
- `.beastmode/meta/IMPLEMENT.md`
- `.beastmode/meta/VALIDATE.md`
- `.beastmode/meta/RELEASE.md`

## 5. Load Situational Context

Read state files if they exist (skip silently if missing):
- Most recent `.beastmode/state/design/*.md` — Active design
- Most recent `.beastmode/state/plan/*.md` — Active plan
- Most recent `.beastmode/state/implement/*.md` — Active implementation
- Most recent `.beastmode/state/validate/*.md` — Active validation

## 6. Light Git Exploration

Run (skip silently if git unavailable):

```bash
git log -5 --oneline
```

```bash
git status
```

## 7. Output Confirmation

Print only:
```
Primed
```
