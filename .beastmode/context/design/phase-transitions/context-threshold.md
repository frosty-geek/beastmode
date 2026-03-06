# Context Threshold

## Context
Auto-advancing to the next phase when context window is nearly full causes degraded behavior and incomplete work.

## Decision
Configurable percentage in config.yaml (`context_threshold`, default 20%). Before auto-advancing, check estimated remaining context. If below threshold, print session-restart instructions instead of chaining.

## Rationale
- Low context causes degraded output quality — better to start fresh
- Configurable threshold lets users tune for their model's context window
- Session-restart instructions ensure continuity across sessions

## Source
state/design/2026-03-04-fix-auto-transitions.md
