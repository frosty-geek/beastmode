# Core Capabilities

## Context
Need to define what beastmode actually does — the concrete feature set that distinguishes it from ad-hoc Claude Code usage.

## Decision
Five-phase workflow with 4-step sub-phase anatomy. Collaborative design with HITL gates. Bite-sized planning with wave-ordered file-isolated tasks. Parallel wave execution. Git worktree isolation. Brownfield discovery. Progressive knowledge hierarchy. Self-improving retro. Squash-per-release commits. Session-start hook with version banner. Unified /beastmode command (init, status, ideas subcommands). Deferred ideas capture and reconciliation via design doc walking. Deadpan persona with context-aware greetings.

## Rationale
- Each capability addresses a specific pain point in long-running agentic workflows
- Capabilities compose — worktree isolation enables parallel execution, retro enables knowledge hierarchy
- /beastmode command consolidates status and ideas alongside init — single entry point with flat subcommand depth

## Source
state/design/2026-03-04-beastmode-command.md
state/design/2026-03-02-session-banner.md
state/design/2026-03-05-dynamic-persona-greetings.md
state/design/2026-03-08-deferred-ideas.md
