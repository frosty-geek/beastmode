# Skill Definitions

## Context
Each workflow skill needs a standard anatomy for the task runner to parse and execute consistently.

## Decision
Each skill has SKILL.md with YAML frontmatter defining name, description, trigger. Phase files numbered 0-3 (0-prime, 1-execute, 2-validate, 3-checkpoint). 0-prime is read-only (loads context only). 1-execute owns all side effects with worktree entry as step 1. Task-runner referenced as first line inside HARD-GATE block. Instructions in imperative voice with numbered steps.

## Rationale
- YAML frontmatter enables plugin marketplace discovery
- 0-prime/1-execute split prevents eager execution bugs observed when both touched worktrees
- Task-runner in HARD-GATE ensures it loads before any phase execution
- Imperative voice makes instructions unambiguous

## Source
state/plan/2026-03-06-skill-cleanup.md
state/plan/2026-03-04-lean-prime-refactor.md
state/plan/2026-03-04-skill-anatomy-refactor.md
