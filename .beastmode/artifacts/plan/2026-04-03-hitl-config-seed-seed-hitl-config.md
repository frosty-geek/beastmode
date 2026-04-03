---
phase: plan
slug: hitl-config-seed
epic: hitl-config-seed
feature: seed-hitl-config
wave: 1
---

# Seed HITL Config

**Design:** `.beastmode/artifacts/design/2026-04-03-hitl-config-seed.md`

## User Stories

1. As a user, I want visible `hitl:` config in my project's `config.yaml` so that I can see and change per-phase HITL behavior without reading CLI source code.
2. As a user, I want design to stay fully human so that the collaborative interview process is never bypassed.
3. As a user, I want plan, implement, validate, and release to be fully auto so that the pipeline runs without blocking on questions.

## What to Build

Add the `hitl:` section to the project's `.beastmode/config.yaml`. The block contains seven fields: five phase-scoped prose strings (`design`, `plan`, `implement`, `validate`, `release`), plus two global settings (`model`, `timeout`).

Phase prose values:
- `design`: `"always defer to human"` — preserves the collaborative interview
- `plan`, `implement`, `validate`, `release`: `"auto-answer all questions, never defer to human"` — enables unattended pipeline execution

Global settings match the init template defaults:
- `model`: `haiku`
- `timeout`: `30`

The existing `cli:` and `github:` sections must be preserved unchanged. The edit appends the `hitl:` block after the existing content.

## Acceptance Criteria

- [ ] `.beastmode/config.yaml` contains a `hitl:` section with all seven fields
- [ ] `design` is set to `"always defer to human"`
- [ ] `plan`, `implement`, `validate`, `release` are all set to `"auto-answer all questions, never defer to human"`
- [ ] `model` is `haiku` and `timeout` is `30`
- [ ] Existing `cli:` and `github:` sections are unchanged
- [ ] File parses as valid YAML
