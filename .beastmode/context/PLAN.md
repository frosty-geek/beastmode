# Plan Context

Conventions and structure for implementation. Naming patterns, code style, project-specific conventions, and directory layout. Plans decompose designs into wave-ordered, file-isolated tasks with complete code.

## Conventions
Naming patterns (UPPERCASE.md for invariant, lowercase.md for variant), skill manifest with YAML frontmatter and task-runner in HARD-GATE, phase file rules (0-prime read-only, 1-execute owns side effects, imperative voice), two-tier gate syntax (HARD-GATE + configurable [GATE|...]), @import semantics (standalone = mandatory, inline = markdown link), branch naming (feature/<feature>), and anti-patterns to avoid.

1. ALWAYS use UPPERCASE.md for invariant meta files, lowercase.md for variant files
2. ALWAYS number phase files 0-3 (0-prime read-only, 1-execute, 2-validate, 3-checkpoint)
3. ALWAYS compose shared functionality via @imports from `skills/_shared/` — NEVER @import between knowledge hierarchy levels (L0/L1/L2/L3)
4. ALWAYS use gate syntax: `## N. [GATE|namespace.gate-id]` with GATE-OPTION subsections
5. ALWAYS use `feature/<feature>` branch naming convention

## Structure
Directory layout with `.beastmode/` as central context hub (context/, meta/, state/ + config.yaml + worktrees/), `skills/` for agent workflows, `agents/` for subagent prompts, `hooks/` for plugin lifecycle scripts, `docs/` for external-facing essays, `scripts/` for maintenance utilities. Write protection enforces state/-only writes during phases with retro-gated promotion.

1. ALWAYS colocate skill interface (SKILL.md) with implementation in `/skills/{verb}/`
2. NEVER store context outside `.beastmode/` — it's the single source of truth
3. Agent prompts live in `/agents/`, shared utilities in `skills/_shared/`
4. Worktrees live at `.beastmode/worktrees/<feature>`, gitignored

## Task Format
Wave-ordered task format for implementation plans. Tasks have Wave and Depends-on fields for ordering, Parallel-safe flags set by /plan's file isolation analysis, bite-sized granularity (one action per step), and file sections with exact paths.

1. ALWAYS include Wave and Depends-on fields on every task
2. ALWAYS include Files section with exact paths (Create/Modify/Test)
3. NEVER mark a wave Parallel-safe without file isolation analysis
4. ALWAYS include verification steps with expected output

## Workflow
Phase lifecycle, session tracking, context reports, parallel execution, retro agents, release git workflow, persona system, and autonomous phase chaining with configurable gates.

1. ALWAYS follow phase lifecycle: design -> plan -> implement -> validate -> release
2. NEVER commit during individual phases — unified commit at /release
3. ALWAYS update status file on phase completion with session paths
