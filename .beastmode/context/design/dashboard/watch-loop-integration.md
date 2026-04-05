# Watch Loop Integration

## Context
The dashboard needs live orchestration data. Two options: poll the watch loop's state externally, or embed the watch loop and subscribe to events.

## Decision
Embed WatchLoop directly in the dashboard process and subscribe via EventEmitter typed events. The logger becomes one subscriber alongside React state hooks.

## Rationale
Embedding avoids IPC complexity and ensures the dashboard IS the orchestrator — no coordination between two processes. The EventEmitter refactor makes the watch loop's internal events available to any subscriber.

## Source
.beastmode/artifacts/design/2026-03-31-fullscreen-dashboard.md
