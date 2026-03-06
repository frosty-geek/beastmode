# Autonomous Chaining

## Context
Fully autonomous feature cycles were blocked by ungated interactions and invisible HTML comment gates.

## Decision
All retro gates (learnings, sops, overrides, context-changes) converted to proper [GATE|...] steps. Release merge-strategy gate added with configurable default in config.yaml. All transition gates support auto mode with context threshold checks.

## Rationale
Every human interaction point must be a configurable gate for autonomous cycles to work. Retro gates separated per-category because learnings are low-risk while SOPs/overrides are high-impact.

## Source
state/plan/2026-03-05-ungated-hitl-fixes.md
state/plan/2026-03-05-hitl-adherence.md
