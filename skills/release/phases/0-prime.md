# 0. Prime

## 1. Announce Skill

"I'm using the /release skill to ship this feature."

## 2. Load Context

Read:
- `.beastmode/context/RELEASE.md`
- `.beastmode/meta/RELEASE.md`

## 3. Load Artifacts

Read status file to find:
- Worktree path and branch
- Design doc
- Plan doc
- Validation report

## 4. Enter Worktree

```bash
cd <worktree-path>
```

## 5. Analyze Changes

```bash
git diff main...HEAD --stat
git log main..HEAD --oneline
```
