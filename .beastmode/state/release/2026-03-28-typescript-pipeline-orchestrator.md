# Release: typescript-pipeline-orchestrator

**Version:** v0.25.0
**Date:** 2026-03-28

## Highlights

Pipeline orchestrator design phase complete. PRD defines `/beastmode orchestrate` subcommand for autonomous multi-epic pipeline coordination with parallel worktree-isolated agents, manifest convergence, and configurable gate handling.

## Features

- Pipeline orchestrator PRD: CronCreate-based poll loop spawning worktree-isolated agents to drive epics through plan -> implement -> validate -> release in parallel
- L2 orchestration context docs: agent spawning, execution model, gate handling, lifecycle, manifest convergence, team organization

## Fixes

- Remove accidentally staged worktree artifacts

## Full Changelog

- `31a5727` design(orchestrator): checkpoint
- `f018de5` Merge worktree-declarative-drifting-beaver: design(orchestrator)
- `46d8b1d` fix: remove accidentally staged worktree
