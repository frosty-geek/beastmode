# Cucumber Store-Lifecycle World Pattern

**Context:** Structured task store integration tests (2026-04-04)

For CRUD-backed store interfaces, scenarios need a clean store instance per test with deterministic state. The store-lifecycle World pattern provides this without file I/O or process spawning.

## Pattern

Create a Cucumber World class that:

1. Holds an `InMemoryTaskStore` instance as a member
2. Exposes it via a typed accessor for step definitions
3. Uses `Before`/`After` hooks to reset the store instance for each scenario

```typescript
export class StoreWorld {
  private _store: TaskStore = new InMemoryTaskStore();

  get store(): TaskStore {
    return this._store;
  }

  reset(): void {
    this._store = new InMemoryTaskStore();
  }
}

// hooks.ts
Before(async function (this: StoreWorld) {
  this.reset();
});
```

**Decision:** `InMemoryTaskStore` as the test double — same `TaskStore` interface as `JsonFileStore`, no disk I/O, deterministic per-scenario isolation.

**Rationale:** File-backed stores require temp directory setup/teardown and introduce I/O timing variability. An in-memory implementation of the same interface gives scenario isolation at zero cost, and also validates the interface contract independently of the file backend. The `InMemoryTaskStore` produced during this pattern becomes a reusable test artifact for all future store-consuming feature tests.

## Boundary

Use store-lifecycle World for: CRUD operations, dependency graph traversal, ready/blocked queries, entity lifecycle, command-to-store round trips.

Do NOT use for: file I/O behavior, concurrency/mutex correctness, store.json schema validation — those require `JsonFileStore` with a real temp directory.

## Collateral benefit

Agent implementing `InMemoryTaskStore` autonomously produced 42 unit tests covering the full interface contract. Treat the in-memory implementation as a test artifact that doubles as a living spec for the interface.

## Source
.beastmode/artifacts/implement/2026-04-04-structured-task-store-integration-tests.md
