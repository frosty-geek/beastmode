# Standard Gates

## Context
Every validation report includes sections for tests, lint, and type checks. For markdown-only projects these are always skipped, but the sections still appear to confirm the validator considered them.

## Decision
Standard gates (tests, lint, types) are included in every report but annotated as skipped when not applicable. Skipped is not-applicable, not a failure.

## Rationale
Consistent report structure regardless of project type. Explicit skip annotation proves the gate was considered, not forgotten. 41/41 artifacts confirm this pattern for markdown-only projects.

## Source
- .beastmode/state/validate/2026-03-04-agents-to-beastmode-migration.md
- .beastmode/state/validate/2026-03-05-hitl-adherence.md
- .beastmode/state/validate/2026-03-06-banner-visibility-fix.md
