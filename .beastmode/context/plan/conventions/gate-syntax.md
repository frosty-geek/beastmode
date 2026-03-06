# Gate Syntax

## Context
Workflow phases have decision points that need human-in-the-loop or autonomous resolution. A consistent syntax enables the task runner to detect and handle gates uniformly.

## Decision
Two-tier system. HARD-GATE (XML tags) for unconditional constraints. Configurable gates use `## N. [GATE|namespace.gate-id]` with `[GATE-OPTION|human]` and `[GATE-OPTION|auto]` subsections. Config resolved from `.beastmode/config.yaml` at runtime. @imports between knowledge hierarchy levels (L0/L1/L2/L3) prohibited; cross-skill @imports from `skills/_shared/` are allowed.

## Rationale
- Uniform syntax enables task-runner pattern matching regardless of heading depth
- Both human and auto options must exist so config can select either
- Runtime config resolution keeps gate definitions self-contained
- Progressive autonomy: start all gates on human, switch to auto as trust builds

## Source
state/plan/2026-03-06-skill-cleanup.md
state/plan/2026-03-04-hitl-gate-config.md
