# .agent → .agents Rename Implementation Plan

**Goal:** Rename `.agent` directory to `.agents` and update all references across the codebase.

**Architecture:** Big Bang approach — rename directory, global find-replace in all files, verify completeness, single atomic commit.

**Tech Stack:** Git, sed/shell commands for bulk replacement

**Design Doc:** [.agent/design/2026-03-01-agent-to-agents-rename.md](.agent/design/2026-03-01-agent-to-agents-rename.md)

---

### Task 0: Rename the Directory

**Files:**
- Rename: `.agent/` → `.agents/`

**Step 1: Rename the directory**

```bash
mv .agent .agents
```

**Step 2: Verify directory renamed**

```bash
ls -la .agents/
```

Expected: Directory listing showing prime/, design/, plan/, etc.

**Step 3: Verify old directory gone**

```bash
ls -la .agent/ 2>&1
```

Expected: "No such file or directory"

---

### Task 1: Update Root Files

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `.gitignore`

**Step 1: Update CLAUDE.md**

Replace all occurrences of `.agent` with `.agents`:

```bash
sed -i '' 's/\.agent/\.agents/g' CLAUDE.md
```

**Step 2: Update README.md**

```bash
sed -i '' 's/\.agent/\.agents/g' README.md
```

**Step 3: Update .gitignore**

```bash
sed -i '' 's/\.agent/\.agents/g' .gitignore
```

**Step 4: Verify changes**

```bash
grep -c "\.agents" CLAUDE.md README.md .gitignore
```

Expected: Count of `.agents` matches in each file

---

### Task 2: Update .agents Internal Files

**Files:**
- Modify: `.agents/CLAUDE.md`
- Modify: `.agents/prime/META.md`
- Modify: `.agents/prime/STACK.md`
- Modify: `.agents/prime/STRUCTURE.md`
- Modify: `.agents/prime/CONVENTIONS.md`
- Modify: `.agents/prime/ARCHITECTURE.md`
- Modify: `.agents/prime/TESTING.md`
- Modify: `.agents/prime/AGENTS.md`

**Step 1: Update all prime files**

```bash
sed -i '' 's/\.agent/\.agents/g' .agents/CLAUDE.md
sed -i '' 's/\.agent/\.agents/g' .agents/prime/*.md
```

**Step 2: Verify changes**

```bash
grep -l "\.agent[^s]" .agents/CLAUDE.md .agents/prime/*.md || echo "All clean"
```

Expected: "All clean"

---

### Task 3: Update Design and Plan Docs

**Files:**
- Modify: `.agents/design/*.md`
- Modify: `.agents/plan/*.md`

**Step 1: Update design docs**

```bash
sed -i '' 's/\.agent/\.agents/g' .agents/design/*.md
```

**Step 2: Update plan docs**

```bash
sed -i '' 's/\.agent/\.agents/g' .agents/plan/*.md
```

**Step 3: Verify changes**

```bash
grep -l "\.agent[^s]" .agents/design/*.md .agents/plan/*.md || echo "All clean"
```

Expected: "All clean"

---

### Task 4: Update Skills

**Files:**
- Modify: `skills/bootstrap/SKILL.md`
- Modify: `skills/bootstrap-wizard/SKILL.md`
- Modify: `skills/bootstrap-discovery/SKILL.md`
- Modify: `skills/design/SKILL.md`
- Modify: `skills/implement/SKILL.md`
- Modify: `skills/plan/SKILL.md`
- Modify: `skills/research/SKILL.md`
- Modify: `skills/release/SKILL.md`
- Modify: `skills/status/SKILL.md`
- Modify: `skills/verify/SKILL.md`

**Step 1: Update all skill files**

```bash
find skills -name "*.md" -exec sed -i '' 's/\.agent/\.agents/g' {} \;
```

**Step 2: Verify changes**

```bash
grep -rl "\.agent[^s]" skills/ || echo "All clean"
```

Expected: "All clean"

---

### Task 5: Update Bootstrap Templates

**Files:**
- Modify: `skills/bootstrap/templates/CLAUDE.md`
- Modify: `skills/bootstrap/templates/META.md`
- Modify: `skills/bootstrap/templates/AGENTS.md`

**Step 1: Update templates**

```bash
sed -i '' 's/\.agent/\.agents/g' skills/bootstrap/templates/*.md
```

**Step 2: Verify changes**

```bash
grep -l "\.agent[^s]" skills/bootstrap/templates/*.md || echo "All clean"
```

Expected: "All clean"

---

### Task 6: Update Agent Definitions

**Files:**
- Modify: `agents/discovery.md`

**Step 1: Update agent definitions**

```bash
sed -i '' 's/\.agent/\.agents/g' agents/*.md
```

**Step 2: Verify changes**

```bash
grep -l "\.agent[^s]" agents/*.md || echo "All clean"
```

Expected: "All clean"

---

### Task 7: Final Verification

**Step 1: Check for any remaining .agent references (not .agents)**

```bash
grep -r "\.agent[^s]" . --include="*.md" 2>/dev/null | grep -v ".agents" || echo "PASS: No .agent references found"
```

Expected: "PASS: No .agent references found"

**Step 2: Check for .agent at end of line**

```bash
grep -r "\.agent$" . --include="*.md" 2>/dev/null || echo "PASS: No end-of-line .agent found"
```

Expected: "PASS: No end-of-line .agent found"

**Step 3: Check .gitignore for any remaining .agent**

```bash
grep "\.agent[^s]" .gitignore || echo "PASS: .gitignore clean"
```

Expected: "PASS: .gitignore clean"

**Step 4: Verify directory structure**

```bash
ls -la .agents/
```

Expected: All subdirectories present (prime/, design/, plan/, release/, research/, status/, verify/, worktrees/)

---

### Task 8: Commit All Changes

**Step 1: Stage all changes**

```bash
git add -A
```

**Step 2: Review staged changes**

```bash
git status
```

Expected: Shows renamed `.agent` → `.agents` and modified files

**Step 3: Commit**

```bash
git commit -m "refactor: rename .agent to .agents

- Rename directory .agent/ to .agents/
- Update all references across 38 files
- Verified no remaining .agent references

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 0 | Rename directory | 1 directory |
| 1 | Update root files | 3 files |
| 2 | Update .agents internal | 8 files |
| 3 | Update design/plan docs | ~10 files |
| 4 | Update skills | ~14 files |
| 5 | Update bootstrap templates | 3 files |
| 6 | Update agent definitions | 1 file |
| 7 | Final verification | - |
| 8 | Commit | - |

**Total:** 38 files, ~213 occurrences, 1 atomic commit
