---
phase: release
slug: model-escalation
epic: model-escalation
bump: minor
---

# Release: model-escalation

**Version:** v0.74.0
**Date:** 2026-04-04

## Highlights

Adds a three-tier model escalation ladder (haiku -> sonnet -> opus) to the implementer agent dispatch. Tasks start cheap on haiku and automatically escalate to more capable models only when blocked or quality review fails with critical issues.

## Features

- Add escalation state tracking and guiding principle to implement skill
- Add model parameter to implementer agent dispatch
- Add escalation trigger to BLOCKED handler (retry exhaustion escalates tier)
- Add escalation trigger to quality review NOT_APPROVED handler (Critical/Important issues)
- Add non-escalation clarification (NEEDS_CONTEXT and spec review FAIL don't escalate)
- Update report and status summary with model tier and escalation count per task
- Add model escalation L1 context entry

## Full Changelog

- `61a2a44` feat(escalation-ladder): add escalation state and guiding principle to implement skill
- `f9abaa0` feat(escalation-ladder): add model parameter to implementer dispatch
- `008027b` feat(escalation-ladder): add escalation trigger to BLOCKED handler
- `e9cf39f` feat(escalation-ladder): add escalation trigger to quality review NOT_APPROVED handler
- `921fa35` feat(escalation-ladder): add non-escalation clarification
- `9a78bbf` feat(escalation-ladder): update report and status summary with model tier and escalation count
- `a712578` feat(escalation-ladder): add model escalation L1 context entry
- `1c3066e` implement(model-escalation-escalation-ladder): add implementation artifacts
- `3c3f97b` implement(model-escalation-escalation-ladder): checkpoint
- `a1892bb` validate(model-escalation): checkpoint
- `2968ade` design(model-escalation): checkpoint
- `61a2a44` plan(model-escalation): checkpoint
