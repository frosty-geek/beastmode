# Autonomous Chaining

## Context
Fully autonomous feature cycles were blocked by ungated interactions and invisible HTML comment gates. Additionally, transition output format was inconsistent across checkpoint files, and multiple components produced duplicate next-step commands.

## Decision
All retro gates converted to proper [GATE|...] steps. Release merge-strategy gate added with configurable default in config.yaml. All transition gates support auto mode with context threshold checks. Standardized output format: human mode uses `Next:` prefix with inline-code command; auto mode chains via Skill() call if context >= threshold, otherwise prints `Start a new session and run:` prefix with inline-code command. All gate output ends with STOP.

## Rationale
Every human interaction point must be a configurable gate for autonomous cycles to work. Retro gates separated per-category because learnings are low-risk while SOPs/overrides are high-impact. Standardized transition output prevents format drift across checkpoints and ensures a single, copy-pasteable command at phase end.

## Source
state/plan/2026-03-05-ungated-hitl-fixes.md
state/plan/2026-03-05-hitl-adherence.md
state/plan/2026-03-08-phase-end-guidance.md
