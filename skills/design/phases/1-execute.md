# 1. Execute

## 1. Create Feature Worktree

**MANDATORY — do not skip this step.**

Derive `<feature>` from the user's topic (kebab-case, e.g. `git-branching-strategy`).

```bash
mkdir -p .beastmode/worktrees
git worktree add ".beastmode/worktrees/<feature>" -b "feature/<feature>"
cd ".beastmode/worktrees/<feature>"
pwd  # confirm you are in the worktree
```

All subsequent work in this session MUST happen inside the worktree. If `cd` or `pwd` shows you are still in the main repo, STOP and fix it.

See @../_shared/worktree-manager.md for full reference.

## 2. Explore Context

- Read relevant files, docs, recent commits
- Understand current architecture
- Identify related components

## 3. Ask Clarifying Questions

- One question at a time
- Multiple choice preferred
- Focus on: purpose, constraints, success criteria

## 4. Propose Approaches

- Present 2-3 different approaches with trade-offs
- Lead with recommended option and explain why
- Be conversational, explain reasoning

## 5. Present Design

Once requirements understood:
- Scale each section to complexity
- Ask after each section if it looks right
- Cover: architecture, components, data flow, error handling, testing

## 6. Iterate Until Ready for Validation

- Go back and clarify as needed
- Keep YAGNI in mind — remove unnecessary features
- Design is ready when all sections covered
