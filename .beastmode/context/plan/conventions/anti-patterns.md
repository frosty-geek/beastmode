# Anti-Patterns

## Context
Recurring mistakes in beastmode development that waste implementation cycles. Documenting anti-patterns prevents re-discovery of known failure modes.

## Decision
Prohibited patterns: shared logic in individual skills (extract to _shared/), circular @imports, hardcoded convention paths, speculative "just in case" documentation, committing during implement phase (/release owns the merge), @ in flowing prose (use markdown links for inline references).

## Rationale
- Each anti-pattern was discovered through actual implementation friction
- Shared logic duplication caused drift across skills
- Hardcoded paths broke during .agents/ to .beastmode/ migration
- Speculative docs caused confusion about what was real vs planned

## Source
state/plan/2026-03-06-skill-cleanup.md
state/plan/2026-03-04-git-branching-strategy.md
state/plan/2026-03-04-skill-anatomy-refactor.md
