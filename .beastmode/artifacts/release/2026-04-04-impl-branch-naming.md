---
phase: release
slug: 1581c9
epic: impl-branch-naming
bump: minor
---

# Release: impl-branch-naming

**Version:** v0.75.0
**Date:** 2026-04-04

## Highlights

Introduces isolated implementation branches (`impl/<slug>--<feature>`) so parallel worktree agents no longer conflict on the shared feature branch. Includes naming utility, idempotent creation, pipeline integration, and automatic cleanup on worktree removal.

## Features

- Add `implBranchName` naming utility for `impl/<slug>--<feature>` convention
- Add idempotent `createImplBranch` for isolated agent work
- Update skill files (SKILL.md, agent, context) to reference impl branch naming
- Create impl branch in pipeline runner before dispatch
- Create impl branch in watch loop before dispatch
- Delete impl branches on worktree removal
- Add implementation report and tasks

## Fixes

- Add `createImplBranch` to worktree mocks and wrap in try-catch for robustness

## Full Changelog

- `2da1d15` feat(impl-branch-skill): update SKILL.md branch naming to impl/<slug>--<feature>
- `2a8cbb0` feat(impl-branch-core): add implBranchName naming utility
- `de20e45` feat(impl-branch-core): add idempotent createImplBranch
- `ae30ed1` feat(impl-branch-skill): update agent and context files to impl/<slug>--<feature>
- `269b283` feat(impl-branch-core): delete impl branches on worktree removal
- `26834b2` feat(impl-branch-skill): add implementation report and tasks
- `0933954` implement(impl-branch-naming-impl-branch-skill): checkpoint
- `438defa` feat(impl-branch-core): create impl branch in pipeline runner before dispatch
- `91e7dd9` feat(impl-branch-core): create impl branch in watch loop before dispatch
- `8fcbcd1` fix(impl-branch-core): add createImplBranch to worktree mocks and wrap in try-catch
- `39e8b60` implement(impl-branch-naming-impl-branch-core): checkpoint
- `6cae4df` validate(impl-branch-naming): checkpoint
