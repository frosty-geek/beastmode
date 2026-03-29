---
phase: design
slug: polling-behaviour
---

## Problem Statement

The `beastmode watch` loop has two concurrent paths that can trigger dispatch: the 60-second `tick()` poll and the event-driven `rescanEpic()` on session completion. Both paths call `processEpic()` without serialization. The `DispatchTracker` check (`hasPhaseSession`) and session registration (`tracker.add()`) are separated by an async `sessionFactory.create()` call, creating a non-atomic check-then-act window where a concurrent caller can pass the same guard and dispatch the same job twice.

## Solution

Add a global async mutex that serializes all dispatch decisions in the watch loop. When `tick()` or `rescanEpic()` enters the dispatch path, it acquires the mutex first. The blocked caller waits (queues) rather than skipping, ensuring every event is eventually processed. This closes the race condition in one shot without requiring persistent state or worktree pre-checks.

## User Stories

1. As a pipeline operator, I want the watch loop to never dispatch the same phase twice for the same epic, so that I don't get conflicting sessions fighting over the same worktree.
2. As a pipeline operator, I want concurrent completion events to queue rather than skip, so that every session completion triggers a re-scan and no advancement is lost.
3. As a contributor, I want a test that proves concurrent `tick()` + `rescanEpic()` results in exactly one dispatch, so that the invariant is enforced in CI.

## Implementation Decisions

- Global async mutex (not per-epic) — one lock for all dispatch decisions, avoids deadlock complexity
- Mutex wraps the entire `processEpic()` call path, including tracker check, session creation, and tracker registration
- Contention behavior is wait/queue, not skip — every caller eventually processes
- Mutex is a simple promise-based queue (no external dependency) — acquire returns a release function
- `tick()` acquires the mutex once per epic iteration (serial by nature), `rescanEpic()` acquires before calling `processEpic()`
- The `WatchLoop` class owns the mutex instance — injected via constructor or as a private field

## Testing Decisions

- Add a concurrent dispatch test: fire `tick()` and `rescanEpic()` simultaneously with a manifest that has a dispatchable action, assert that `sessionFactory.create()` is called exactly once
- Use the existing `WatchDeps` dependency injection interface to mock `sessionFactory` and `scanEpics`
- Test should use a real async mutex (not mocked) to validate the serialization behavior

## Out of Scope

- Crash recovery / persistent session tracking — deferred, requires process restart to trigger
- Per-epic mutex — unnecessary given single-process architecture
- Worktree existence pre-checks as a secondary guard
- Manifest freshness guarantees (ensuring reconciliation completes before re-scan)
- Changes to the DispatchTracker itself (it works correctly under serialized access)

## Further Notes

The in-memory DispatchTracker is the right abstraction for single-process dispatch prevention. The mutex makes it correct by ensuring all access is serialized. If crash recovery becomes a concern later, persistent session tracking can be layered on without changing the mutex design.

## Deferred Ideas

- Persistent active-sessions file for crash recovery (write session ID to disk before dispatch, reconcile on startup)
- Worktree existence guard as defense-in-depth
- Per-epic mutex for higher fan-out throughput
