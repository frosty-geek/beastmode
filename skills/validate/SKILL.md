---
name: validate
description: Quality gate — testing, linting, validating. Use after implement. Runs tests and checks quality gates.
---

# /validate

Verify code changes meet quality standards before release.

<HARD-GATE>
No release without passing validation. [→ Why](references/quality-gates.md)
</HARD-GATE>

## Phases

1. [Prime](phases/1-prime.md) — Load context, identify checks
2. [Execute](phases/2-execute.md) — Run tests and quality checks
3. [Validate](phases/3-validate.md) — Analyze results against gates
4. [Checkpoint](phases/4-checkpoint.md) — Save report, suggest next step
