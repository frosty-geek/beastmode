---
phase: release
slug: structured-task-store
epic: structured-task-store
bump: minor
---

# Release: structured-task-store

**Version:** v0.84.0
**Date:** 2026-04-04

## Highlights

Adds a structured task store (`store.json`) with hash-based IDs, cross-epic dependency modeling, queryable CLI commands, and dual-reference ID resolution — replacing fragile slug-based manifest naming with permanent `bm-xxxx` identifiers.

## Features

- feat(store): add JsonFileStore with load/save round-trip
- feat(store): add barrel export for store module
- feat(store): add resolveIdentifier function with ambiguity detection
- feat(store): export resolveIdentifier from barrel
- feat(store-cli): wire store command into CLI arg parser and routing
- feat(store-cli): implement epic CRUD commands with testable helpers
- feat(store-cli): implement feature CRUD commands
- feat(store-cli): implement query commands (ready, blocked, tree, search)
- feat(store-cli): add error handling and output contract tests
- feat(store-cli): update help text with store commands
- feat(phase): integrate store-based ID resolution with manifest fallback
- feat(integration-tests): add InMemoryTaskStore for test use
- feat(integration-tests): add TaskStore type stubs
- feat(integration-tests): add StoreWorld and lifecycle hooks
- feat(integration-tests): US-1 store ready scenarios and steps
- feat(integration-tests): US-2 hash IDs, US-5 dual reference, US-7 typed artifacts
- feat(integration-tests): US-3 cross-epic deps, US-6 dependency ordering
- feat(integration-tests): US-4 tree, US-8 JSON, US-9 backend, US-10 blocked
- feat(integration-tests): add store cucumber profile
- feat(integration-tests): update watch-loop and wave-failure for dependency model

## Fixes

- fix(store): remove unused Epic import from resolve.ts
- fix(phase): use resolved worktreeSlug for epicSlug to propagate canonical slug
- fix(phase): propagate resolved epic slug to downstream pipeline
- fix(integration-tests): fix ready() epic filtering and circular dep scenario

## Chores

- refactor(phase): use barrel import for store module

## Full Changelog

- db85523 design(structured-task-store): checkpoint
- 9125ea1 design(structured-task-store): checkpoint
- 7689e21 design(structured-task-store): checkpoint
- 5b1bc17 plan(structured-task-store): checkpoint
- aa332ab feat(integration-tests): add TaskStore type stubs
- 62c55ea feat(integration-tests): add InMemoryTaskStore for test use
- 928752b feat(integration-tests): add StoreWorld and lifecycle hooks
- be8ff12 feat(integration-tests): US-1 store ready scenarios and steps
- e0d1bbd feat(integration-tests): US-3 cross-epic deps, US-6 dependency ordering
- d246302 feat(integration-tests): US-2 hash IDs, US-5 dual reference, US-7 typed artifacts
- ce08e9e feat(integration-tests): US-4 tree, US-8 JSON, US-9 backend, US-10 blocked
- 45a2a82 feat(integration-tests): add store cucumber profile
- 11b9df0 feat(integration-tests): update watch-loop and wave-failure for dependency model
- 0ba43bf fix(integration-tests): fix ready() epic filtering and circular dep scenario
- 8e2909e implement(structured-task-store-integration-tests): checkpoint
- fa07809 feat(store): add JsonFileStore with load/save round-trip
- 3914ce4 test(store): add CRUD tests for JsonFileStore
- 0ccb804 test(store): add query and dependency graph tests for JsonFileStore
- a0890a8 test(store): add transact concurrency tests for JsonFileStore
- e462446 feat(store): add barrel export for store module
- 311eea1 implement(structured-task-store-store-backend): checkpoint
- 2e1f04a feat(store): add resolveIdentifier function with ambiguity detection
- 0918306 feat(store): export resolveIdentifier from barrel
- 7d38b95 feat(store-cli): implement epic CRUD commands with testable helpers
- 5c65e8d feat(store-cli): wire store command into CLI arg parser and routing
- 31302ca feat(phase): integrate store-based ID resolution with manifest fallback
- cc9c61e fix(phase): propagate resolved epic slug to downstream pipeline
- 33ba777 fix(phase): use resolved worktreeSlug for epicSlug to propagate canonical slug
- fc12e42 feat(store-cli): implement feature CRUD commands
- 92d53d4 refactor(phase): use barrel import for store module
- 58abd50 feat(store-cli): implement query commands (ready, blocked, tree, search)
- 543f389 fix(store): remove unused Epic import from resolve.ts
- 5ba6b12 feat(store-cli): add error handling and output contract tests
- 9f008a3 feat(store-cli): update help text with store commands
- ac8c69e implement(structured-task-store-id-resolution): checkpoint
- 185af28 implement(structured-task-store-id-resolution): checkpoint
- 77620a0 implement(structured-task-store-store-cli): checkpoint
- b7567fd validate(structured-task-store): checkpoint
