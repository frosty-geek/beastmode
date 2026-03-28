# Agent Spawning

## Context
Each epic needs phase-specific work executed in isolation. Implement phases require per-feature parallelism.

## Decision
One agent per phase per epic, except implement which fans out one agent per feature. Agents use `isolation: "worktree"`, `mode: "bypassPermissions"`, `run_in_background: true`. Agent prompts include role, task claim, skill invocation via Skill tool, and team-lead messaging.

## Rationale
- Per-phase agents provide natural task boundaries and skill mapping
- Per-feature fan-out at implement maximizes parallelism where the work is most decomposable
- Worktree isolation prevents agents from interfering with each other or the main branch
- Background execution allows the orchestrator to continue polling while agents work

## Source
state/design/2026-03-28-orchestrator.md
