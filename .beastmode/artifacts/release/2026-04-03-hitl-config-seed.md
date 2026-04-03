---
phase: release
slug: hitl-config-seed
epic: hitl-config-seed
bump: minor
---

# Release: hitl-config-seed

**Bump:** minor
**Date:** 2026-04-03

## Highlights

Seeds the `hitl:` configuration section into `.beastmode/config.yaml` for existing projects that predate the HITL feature, making per-phase human-in-the-loop behavior visible and tunable without reading CLI source.

## Features

- Add `hitl:` section to `.beastmode/config.yaml` with per-phase HITL control
- Design phase set to `"always defer to human"` (collaborative interview preserved)
- Plan, implement, validate, release set to `"auto-answer all questions, never defer to human"`
- Include `model: haiku` and `timeout: 30` matching init template defaults

## Full Changelog

- `32730f8` design(hitl-config-seed): checkpoint
- `7114d7a` design(hitl-config-seed): checkpoint
- `f2de2d2` plan(hitl-config-seed): checkpoint
- `0ee0287` implement(hitl-config-seed-seed-hitl-config): checkpoint
- `fac3865` validate(hitl-config-seed): checkpoint
