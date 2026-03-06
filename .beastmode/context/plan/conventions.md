# Conventions

Naming patterns, code style, and anti-patterns for beastmode development. UPPERCASE.md for invariant files, lowercase.md for variant. Phase files numbered 0-3 (0-prime read-only). Skills use YAML frontmatter manifests. @imports allowed from skills/_shared/ but never between hierarchy levels.

## File Naming
UPPERCASE.md for invariant meta files (always exist, same structure). lowercase.md for variant files (plans, research, date-prefixed). State files: YYYY-MM-DD-feature-name.md.

1. ALWAYS use UPPERCASE.md for invariant meta files, lowercase.md for variant files
2. ALWAYS prefix state files with date: YYYY-MM-DD-feature-name.md
3. NEVER mix naming conventions within a directory level

## Skill Definitions
Each skill has SKILL.md with YAML frontmatter defining name, description, trigger, phases, inputs, and outputs. Phase files follow 0-prime through 3-checkpoint numbering. 0-prime is read-only (loads context, no side effects). 1-execute owns all side effects (worktree entry is step 1).

1. ALWAYS define skill interface in SKILL.md with YAML frontmatter
2. ALWAYS number phase files: 0-prime, 1-execute, 2-validate, 3-checkpoint
3. ALWAYS write phase instructions in imperative voice with numbered steps
4. ALWAYS keep 0-prime read-only — no worktree entry, no file writes
5. ALWAYS make worktree entry step 1 of 1-execute
6. ALWAYS reference task-runner as first line inside HARD-GATE block — never as trailing @import

## Gate Syntax
Two-tier gate system. HARD-GATE for unconditional constraints. Configurable gates use `## N. [GATE|namespace.gate-id]` with GATE-OPTION subsections. Gate detection in task-runner.md matches the pattern and reads mode from config.yaml.

1. ALWAYS use exact gate syntax: `## N. [GATE|namespace.gate-id]`
2. ALWAYS provide both `[GATE-OPTION|human]` and `[GATE-OPTION|auto]` subsections
3. ALWAYS read mode from `.beastmode/config.yaml` under `gates.` or `transitions.` key
4. ALWAYS compose shared functionality via @imports from `skills/_shared/` — NEVER @import between knowledge hierarchy levels (L0/L1/L2/L3)

## Branch Naming
Feature branches use `feature/<feature>` naming. Worktrees at `.beastmode/worktrees/<feature>`. Design creates both, all phases inherit, /release merges and cleans up.

1. ALWAYS use `feature/<feature>` branch naming
2. ALWAYS create worktrees at `.beastmode/worktrees/<feature>`
3. NEVER work directly on main — use worktree isolation

## Anti-Patterns
Common mistakes to avoid in beastmode development.

1. NEVER put shared logic in individual skills — extract to `skills/_shared/`
2. NEVER create circular @imports between files
3. NEVER hardcode paths that should be convention-based
4. NEVER add "just in case" sections to context docs — document what exists
5. NEVER commit during implement phase — /release owns the merge
6. NEVER use @ in flowing prose — use markdown links for inline references, reserve @ for standalone mandatory imports

## Related Decisions
- Skill anatomy standardized to 4 sub-phases. See [skill-anatomy-refactor](../../state/plan/2026-03-04-skill-anatomy-refactor.md)
- Lean prime refactor — 0-prime read-only. See [lean-prime-refactor](../../state/plan/2026-03-04-lean-prime-refactor.md)
- Git branching with feature/<feature> convention. See [git-branching-strategy](../../state/plan/2026-03-04-git-branching-strategy.md)
- HITL gate configuration system. See [hitl-gate-config](../../state/plan/2026-03-04-hitl-gate-config.md)
