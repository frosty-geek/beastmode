# Conventions

## File Naming
- ALWAYS use UPPERCASE.md for invariant meta files, lowercase.md for variant files — naming signals intent
- ALWAYS prefix state files with date: YYYY-MM-DD-feature-name.md — chronological ordering
- NEVER mix naming conventions within a directory level — consistency

## Skill Definitions
- ALWAYS define skill interface in SKILL.md with YAML frontmatter — standardized discovery
- ALWAYS number phase files: 0-prime, 1-execute, 2-validate, 3-checkpoint — sub-phase anatomy
- ALWAYS write phase instructions in imperative voice with numbered steps — actionable clarity
- ALWAYS keep 0-prime read-only — no worktree entry, no file writes
- ALWAYS make worktree entry step 1 of 1-execute — first side effect
- ALWAYS reference task-runner as first line inside HARD-GATE block — never as trailing @import

## Gate Syntax
Two-tier gate system. HARD-GATE for unconditional constraints. Configurable gates use `## N. [GATE|namespace.gate-id]` with GATE-OPTION subsections. Gate detection in task-runner.md matches the pattern and reads mode from config.yaml.

1. ALWAYS use exact gate syntax: `## N. [GATE|namespace.gate-id]`
2. ALWAYS provide both `[GATE-OPTION|human]` and `[GATE-OPTION|auto]` subsections
3. ALWAYS read mode from `.beastmode/config.yaml` under `gates.` or `transitions.` key
4. ALWAYS compose shared functionality via @imports from `skills/_shared/` — NEVER @import between knowledge hierarchy levels (L0/L1/L2/L3)
5. ALWAYS use standardized transition output: human mode = `Next:` + inline-code command; auto/low-context = `Start a new session and run:` + inline-code command
6. ALWAYS end transition gates with STOP — no prose, explanation, or alternatives after the command

## Branch Naming
- ALWAYS use `feature/<feature>` branch naming — convention
- ALWAYS create worktrees at `.beastmode/worktrees/<feature>` — standard location
- NEVER work directly on main — use worktree isolation
- Design creates both branch and worktree, all phases inherit, /release merges and cleans up — full lifecycle

## Anti-Patterns
- NEVER put shared logic in individual skills — extract to `skills/_shared/`
- NEVER create circular @imports between files — dependency loops
- NEVER hardcode paths that should be convention-based — brittleness
- NEVER add "just in case" sections to context docs — document what exists
- NEVER commit during implement phase — /release owns the merge
- NEVER use @ in flowing prose — use markdown links for inline references, reserve @ for standalone mandatory imports

## Related Decisions
- Skill anatomy standardized to 4 sub-phases — see [skill-anatomy-refactor](../../state/plan/2026-03-04-skill-anatomy-refactor.md)
- Lean prime refactor — 0-prime read-only, see [lean-prime-refactor](../../state/plan/2026-03-04-lean-prime-refactor.md)
- Git branching with feature/<feature> convention — see [git-branching-strategy](../../state/plan/2026-03-04-git-branching-strategy.md)
- HITL gate configuration system — see [hitl-gate-config](../../state/plan/2026-03-04-hitl-gate-config.md)
