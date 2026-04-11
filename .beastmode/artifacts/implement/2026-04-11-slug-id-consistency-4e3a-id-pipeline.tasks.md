# ID Pipeline — Implementation Tasks

## Goal

Replace all slug-based internal lookups with entity ID-based lookups across reconcile functions, pipeline runner, and store interface. Remove `store.find()` entirely.

## Architecture

- **Reconcile functions** (`cli/src/pipeline/reconcile.ts`): Change parameter from `slug: string` to `epicId: string`, replace `store.find(slug)` with `store.getEpic(epicId)`, change `withLock` key from slug to ID
- **Pipeline runner** (`cli/src/pipeline/runner.ts`): Pass `epicId` instead of `epicSlug` to reconcile functions, replace all `store.find(epicSlug)` calls with `store.getEpic(epicId)` using `PipelineConfig.epicId`
- **Store interface** (`cli/src/store/types.ts`): Remove `find()` from `TaskStore` interface
- **Store implementations**: Remove `find()` from `InMemoryTaskStore` and `JsonFileStore`
- **reconcileAll**: Update to pass `epic.id` instead of `epic.slug` to reconcile functions

## Tech Stack

- TypeScript, Bun runtime, vitest for unit tests, Cucumber/Gherkin for BDD

## File Structure

- **Modify:** `cli/src/pipeline/reconcile.ts` — Change all 6 reconcile function signatures from `slug: string` to `epicId: string`, replace `store.find()` with `store.getEpic()`, change `withLock` key to epicId, update `reconcileAll` to pass `epic.id`
- **Modify:** `cli/src/pipeline/runner.ts` — Replace all `store.find(epicSlug)` with `store.getEpic(config.epicId!)` or `store.getEpic(epicEntity.id)`, pass `epicId` to reconcile functions
- **Modify:** `cli/src/store/types.ts` — Remove `find()` from `TaskStore` interface
- **Modify:** `cli/src/store/in-memory.ts` — Remove `find()` implementation
- **Modify:** `cli/src/store/json-file-store.ts` — Remove `find()` delegation
- **Modify:** `cli/src/__tests__/pipeline-runner.test.ts` — Update mock store from `find()` to `getEpic()`, update assertions
- **Modify:** `cli/src/store/in-memory.test.ts` — Remove `find()` test cases
- **Modify:** `cli/src/store/json-file-store.test.ts` — Remove `find()` test cases
- **Create:** `cli/features/store/id-pipeline.feature` — BDD integration test for ID-based lookups
- **Create:** `cli/features/store/step_definitions/id-pipeline.steps.ts` — BDD step definitions

---

### Task 0: Integration Test (BDD)

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/features/store/id-pipeline.feature`
- Create: `cli/features/store/step_definitions/id-pipeline.steps.ts`
- Modify: `cli/cucumber.json`

The feature plan has two Gherkin blocks. The first tests reconciler/mutex ID usage — but reconcile functions have heavy I/O deps (XState, filesystem, git tags) making them unsuitable for pure store-world BDD. The second block tests store.find() removal and getEpic/getFeature as sole lookup paths — this is directly testable with the store-lifecycle world.

We implement the second Gherkin block (store lookups) as a runnable BDD test. The first block's assertions (reconciler uses ID, mutex uses ID) are covered by the unit test changes in Tasks 1–3.

- [ ] **Step 1: Create feature file**

```gherkin
# cli/features/store/id-pipeline.feature
@slug-id-consistency @store
Feature: Single lookup path per identifier type -- getEpic and getFeature

  The store exposes getEpic() and getFeature() as the sole lookup
  methods. The generic store.find() is removed. Each function accepts
  exactly one identifier type, eliminating dispatch ambiguity.

  Background:
    Given a store is initialized
    And an epic "auth-system" exists with features "login-flow" and "token-cache"

  Scenario: getEpic retrieves an epic by its entity ID
    When a caller invokes getEpic with the epic's entity ID
    Then the store should return the epic
    And the epic should contain its slug and name

  Scenario: getFeature retrieves a feature by its entity ID
    When a caller invokes getFeature with the feature's entity ID
    Then the store should return the feature
    And the feature should contain its slug and parent epic reference

  Scenario: No generic find method exists on the store
    When a caller attempts to invoke a generic find method on the store
    Then the method should not exist
    And the caller should be directed to use getEpic or getFeature
```

- [ ] **Step 2: Create step definitions**

```typescript
// cli/features/store/step_definitions/id-pipeline.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { expect } from "chai";
import type { StoreWorld } from "../support/store-world.js";
import type { Epic, Feature } from "../../../src/store/types.js";

// Background steps reuse existing "a store is initialized" from store-entity.steps.ts

Given(
  "an epic {string} exists with features {string} and {string}",
  function (this: StoreWorld, epicName: string, feat1: string, feat2: string) {
    this.createEpic(epicName);
    this.createFeature(feat1, epicName);
    this.createFeature(feat2, epicName);
  },
);

When(
  "a caller invokes getEpic with the epic's entity ID",
  function (this: StoreWorld) {
    const epic = this.getEpicByName("auth-system");
    this.lastOutput = this.store.getEpic(epic.id);
  },
);

Then("the store should return the epic", function (this: StoreWorld) {
  expect(this.lastOutput).to.not.be.undefined;
  expect((this.lastOutput as Epic).type).to.equal("epic");
});

Then(
  "the epic should contain its slug and name",
  function (this: StoreWorld) {
    const epic = this.lastOutput as Epic;
    expect(epic.slug).to.be.a("string").and.not.be.empty;
    expect(epic.name).to.equal("auth-system");
  },
);

When(
  "a caller invokes getFeature with the feature's entity ID",
  function (this: StoreWorld) {
    const feature = this.getFeatureByName("login-flow");
    this.lastOutput = this.store.getFeature(feature.id);
  },
);

Then("the store should return the feature", function (this: StoreWorld) {
  expect(this.lastOutput).to.not.be.undefined;
  expect((this.lastOutput as Feature).type).to.equal("feature");
});

Then(
  "the feature should contain its slug and parent epic reference",
  function (this: StoreWorld) {
    const feature = this.lastOutput as Feature;
    expect(feature.slug).to.be.a("string").and.not.be.empty;
    const epic = this.getEpicByName("auth-system");
    expect(feature.parent).to.equal(epic.id);
  },
);

When(
  "a caller attempts to invoke a generic find method on the store",
  function (this: StoreWorld) {
    this.lastOutput = typeof (this.store as any).find;
  },
);

Then("the method should not exist", function (this: StoreWorld) {
  expect(this.lastOutput).to.equal("undefined");
});

Then(
  "the caller should be directed to use getEpic or getFeature",
  function (this: StoreWorld) {
    // Verify getEpic and getFeature are available as functions
    expect(typeof this.store.getEpic).to.equal("function");
    expect(typeof this.store.getFeature).to.equal("function");
  },
);
```

- [ ] **Step 3: Add cucumber profile**

Add to `cli/cucumber.json` a new `"id-pipeline"` profile:

```json
"id-pipeline": {
  "paths": ["features/store/id-pipeline.feature"],
  "import": [
    "features/store/step_definitions/id-pipeline.steps.ts",
    "features/store/step_definitions/store-entity.steps.ts",
    "features/store/support/store-world.ts",
    "features/store/support/store-hooks.ts"
  ],
  "format": ["progress-bar"],
  "publishQuiet": true
}
```

- [ ] **Step 4: Run test to verify RED state**

Run: `cd cli && npx cucumber-js --profile id-pipeline`
Expected: FAIL — the "No generic find method exists" scenario should fail because `store.find` still exists (returns `"function"`, not `"undefined"`). The first two scenarios should pass since getEpic/getFeature already work.

- [ ] **Step 5: Commit**

```bash
git add cli/features/store/id-pipeline.feature cli/features/store/step_definitions/id-pipeline.steps.ts cli/cucumber.json
git commit -m "test(id-pipeline): add BDD integration test for ID-based store lookups"
```

---

### Task 1: Reconcile Functions — Signature and Lookup Migration

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/pipeline/reconcile.ts`

Change all 6 reconcile functions plus `reconcileAll` plus `withLock`:

1. Rename parameter `slug` → `epicId` in all 6 exported reconcile functions
2. Replace `store.find(slug)` → `store.getEpic(epicId)` (drop the `epic.type !== "epic"` check since `getEpic` only returns epics)
3. Change `withLock(slug, ...)` → `withLock(epicId, ...)` (and rename the `withLock` param from `slug` to `key`)
4. In `reconcileDesign`: the `store.find(slug)` fallback creates an epic if not found — replace with `store.getEpic(epicId)` with same creation fallback
5. In `reconcileAll`: pass `epic.id` instead of `epic.slug` to each reconcile function

- [ ] **Step 1: Write the failing test**

Create a temporary test to verify reconcile functions reject slug-based calls:

Run: `cd cli && bun --bun vitest run src/pipeline/reconcile.ts --passWithNoTests`
Expected: PASS (just compile check)

We'll verify via grep at the end of this task instead of a separate unit test, since reconcile functions are integration-heavy (XState, filesystem). The pipeline-runner test (Task 3) covers the call sites.

- [ ] **Step 2: Update withLock signature**

In `cli/src/pipeline/reconcile.ts`, change:
```typescript
async function withLock<T>(slug: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(slug) ?? Promise.resolve();
  let release!: () => void;
  locks.set(slug, new Promise<void>((r) => { release = r; }));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    locks.delete(slug);
  }
}
```
to:
```typescript
async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  locks.set(key, new Promise<void>((r) => { release = r; }));
  await prev;
  try {
    return await fn();
  } finally {
    release();
    locks.delete(key);
  }
}
```

- [ ] **Step 3: Update reconcileDesign**

Change signature from `(projectRoot: string, slug: string, wtPath: string)` to `(projectRoot: string, epicId: string, wtPath: string)`.

Replace body:
- `loadWorktreePhaseOutput(wtPath, "design", slug)` → `loadWorktreePhaseOutput(wtPath, "design", epicId)`
- `withLock(slug, ...)` → `withLock(epicId, ...)`
- `let epic = store.find(slug)` → `let epic = store.getEpic(epicId)`
- Remove `if (!epic || epic.type !== "epic")` → just `if (!epic)`
- In the epic creation fallback: change `store.addEpic({ name: realSlug ?? slug })` → `store.addEpic({ name: realSlug ?? epicId })`

- [ ] **Step 4: Update reconcilePlan**

Change signature from `(projectRoot: string, slug: string, wtPath: string)` to `(projectRoot: string, epicId: string, wtPath: string)`.

Replace body:
- `loadWorktreePhaseOutput(wtPath, "plan", slug)` → `loadWorktreePhaseOutput(wtPath, "plan", epicId)`
- `withLock(slug, ...)` → `withLock(epicId, ...)`
- `const epic = store.find(slug)` → `const epic = store.getEpic(epicId)`
- `if (!epic || epic.type !== "epic")` → `if (!epic)`

- [ ] **Step 5: Update reconcileFeature**

Change signature from `(projectRoot: string, slug: string, featureSlug: string, wtPath: string)` to `(projectRoot: string, epicId: string, featureSlug: string, wtPath: string)`.

Replace body:
- `loadWorktreeFeatureOutput(wtPath, "implement", slug, featureSlug)` → `loadWorktreeFeatureOutput(wtPath, "implement", epicId, featureSlug)`
- `withLock(slug, ...)` → `withLock(epicId, ...)`
- `const epic = store.find(slug)` → `const epic = store.getEpic(epicId)`
- `if (!epic || epic.type !== "epic")` → `if (!epic)`

- [ ] **Step 6: Update reconcileImplement**

Change signature from `(projectRoot: string, slug: string)` to `(projectRoot: string, epicId: string)`.

Replace body:
- `withLock(slug, ...)` → `withLock(epicId, ...)`
- `const epic = store.find(slug)` → `const epic = store.getEpic(epicId)`
- `if (!epic || epic.type !== "epic")` → `if (!epic)`

- [ ] **Step 7: Update reconcileValidate**

Change signature from `(projectRoot: string, slug: string, wtPath: string)` to `(projectRoot: string, epicId: string, wtPath: string)`.

Replace body:
- `loadWorktreePhaseOutput(wtPath, "validate", slug)` → `loadWorktreePhaseOutput(wtPath, "validate", epicId)`
- `withLock(slug, ...)` → `withLock(epicId, ...)`
- `const epic = store.find(slug)` → `const epic = store.getEpic(epicId)`
- `if (!epic || epic.type !== "epic")` → `if (!epic)`

- [ ] **Step 8: Update reconcileRelease**

Change signature from `(projectRoot: string, slug: string, wtPath: string)` to `(projectRoot: string, epicId: string, wtPath: string)`.

Replace body:
- `loadWorktreePhaseOutput(wtPath, "release", slug)` → `loadWorktreePhaseOutput(wtPath, "release", epicId)`
- `withLock(slug, ...)` → `withLock(epicId, ...)`
- `const epic = store.find(slug)` → `const epic = store.getEpic(epicId)`
- `if (!epic || epic.type !== "epic")` → `if (!epic)`

- [ ] **Step 9: Update reconcileAll**

Change from passing `epic.slug` to passing `epic.id`:
- `reconcileDesign(projectRoot, epic.slug, wtPath)` → `reconcileDesign(projectRoot, epic.id, wtPath)`
- `reconcilePlan(projectRoot, epic.slug, wtPath)` → `reconcilePlan(projectRoot, epic.id, wtPath)`
- `reconcileFeature(projectRoot, epic.slug, feature.slug, wtPath)` → `reconcileFeature(projectRoot, epic.id, feature.slug, wtPath)`
- `reconcileValidate(projectRoot, epic.slug, wtPath)` → `reconcileValidate(projectRoot, epic.id, wtPath)`
- `reconcileRelease(projectRoot, epic.slug, wtPath)` → `reconcileRelease(projectRoot, epic.id, wtPath)`

- [ ] **Step 10: Verify no store.find remains in reconcile.ts**

Run: `grep -n 'store\.find(' cli/src/pipeline/reconcile.ts`
Expected: No output (zero matches)

Run: `grep -n 'withLock(slug' cli/src/pipeline/reconcile.ts`
Expected: No output (zero matches)

- [ ] **Step 11: Compile check**

Run: `cd cli && npx tsc --noEmit 2>&1 | head -30`
Expected: Errors in runner.ts (expected — it still passes slug to reconcile functions). No errors in reconcile.ts itself.

- [ ] **Step 12: Commit**

```bash
git add cli/src/pipeline/reconcile.ts
git commit -m "refactor(reconcile): replace slug params with epicId, use getEpic instead of find"
```

---

### Task 2: Pipeline Runner — epicId Passthrough

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/pipeline/runner.ts`

The runner has these `store.find(epicSlug)` call sites that need migration:
1. Step 3.5 (line 188): early-issues — `taskStore.find(epicSlug)` → `taskStore.getEpic(config.epicId!)`
2. Step 6/7 (lines 228-248): reconcile switch — pass `epicId` instead of `epicSlug` to all reconcile functions
3. Design rename (line 303): `renameStore.find(finalEpic.slug)` → `renameStore.getEpic(epicEntity.id)` where `epicEntity` was already resolved
4. Step 8 (line 325): github.mirror — `taskStore.find(epicSlug)` → `taskStore.getEpic(config.epicId!)`
5. Step 8.5 (line 357): commit-issue-ref — `taskStore.find(epicSlug)` → `taskStore.getEpic(config.epicId!)`
6. Step 8.9 (line 400): branch-link — `taskStore.find(epicSlug)` → `taskStore.getEpic(config.epicId!)`
7. Step 9 (line 446): release cleanup — `doneStore.find(epicSlug)` → `doneStore.getEpic(config.epicId!)`

For the design phase (where epic doesn't exist yet), `config.epicId` may be undefined. The design reconcile handles creation internally, so step 3.5 and post-reconcile steps need special handling.

Strategy:
- Before step 3.5: resolve `epicId` from `config.epicId` or by finding via slug for design phase compatibility
- After reconcile (design phase): update `epicId` from the reconcileResult
- All subsequent steps use the resolved `epicId`

- [ ] **Step 1: Add epicId resolution at runner entry**

After `let epicSlug = config.epicSlug;` (line 129), add:

```typescript
let epicId = config.epicId;
```

This `epicId` variable will be updated after design reconcile if needed.

- [ ] **Step 2: Update Step 3.5 (early-issues)**

Replace the `store.find(epicSlug)` block (lines 185-199):

```typescript
const taskStore = new JsonFileStore(resolve(config.projectRoot, ".beastmode", "state", "store.json"));
taskStore.load();
let epicEntity = epicId ? taskStore.getEpic(epicId) : undefined;
if (epicEntity) {
  await ensureEarlyIssues({
    phase: config.phase,
    epicId: epicEntity.id,
    projectRoot: config.projectRoot,
    config: config.config,
    store: taskStore,
    resolved: config.resolved,
    logger,
  });
}
```

Note: For design phase, `epicId` may be undefined and `epicEntity` null — early issues are skipped (safe, they'll be created at reconcile).

- [ ] **Step 3: Update Step 6/7 (reconcile switch)**

Replace the reconcile switch (lines 228-248) to pass `epicId!` instead of `epicSlug`:

For design phase: the reconcile function will create the epic if not found, so we pass `epicId ?? epicSlug` (design phase may not have an epicId yet — the reconcile function handles creation with the placeholder).

```typescript
switch (config.phase) {
  case "design":
    reconcileResult = await reconcileDesign(config.projectRoot, epicId ?? epicSlug, worktreePath);
    break;
  case "plan":
    reconcileResult = await reconcilePlan(config.projectRoot, epicId!, worktreePath);
    break;
  case "implement":
    if (config.featureSlug) {
      reconcileResult = await reconcileFeature(config.projectRoot, epicId!, config.featureSlug, worktreePath);
    } else {
      reconcileResult = await reconcileImplement(config.projectRoot, epicId!);
    }
    break;
  case "validate":
    reconcileResult = await reconcileValidate(config.projectRoot, epicId!, worktreePath);
    break;
  case "release":
    reconcileResult = await reconcileRelease(config.projectRoot, epicId!, worktreePath);
    break;
}
```

- [ ] **Step 4: Update design rename block**

After reconcile, the design phase may produce a new epicId. Update the `epicId` variable from reconcileResult:

After line 250 (`if (reconcileResult) { logger.info(...); }`), add:
```typescript
// Update epicId from reconcile result
if (reconcileResult?.epic?.id) {
  epicId = reconcileResult.epic.id;
}
```

Then in the design rename block (around line 303), replace:
```typescript
const renamedEntity = renameStore.find(finalEpic.slug);
```
with:
```typescript
const renamedEntity = renameStore.getEpic(epicId!);
```

- [ ] **Step 5: Update Step 8 (github.mirror)**

Replace lines 324-325:
```typescript
const epicEntity = taskStore.find(epicSlug);
if (epicEntity && epicEntity.type === "epic") {
```
with:
```typescript
const epicEntity = epicId ? taskStore.getEpic(epicId) : undefined;
if (epicEntity) {
```

- [ ] **Step 6: Update Step 8.5 (commit-issue-ref)**

Replace lines 357-358:
```typescript
const epicEntity = taskStore.find(epicSlug);
if (epicEntity && epicEntity.type === "epic") {
```
with:
```typescript
const epicEntity = epicId ? taskStore.getEpic(epicId) : undefined;
if (epicEntity) {
```

- [ ] **Step 7: Update Step 8.9 (branch-link)**

Replace lines 400-401:
```typescript
const epicEntity = taskStore.find(epicSlug);
if (epicEntity && epicEntity.type === "epic") {
```
with:
```typescript
const epicEntity = epicId ? taskStore.getEpic(epicId) : undefined;
if (epicEntity) {
```

- [ ] **Step 8: Update Step 9 (release cleanup)**

Replace lines 446-447:
```typescript
const doneEntity = doneStore.find(epicSlug);
if (doneEntity && doneEntity.type === "epic") {
```
with:
```typescript
const doneEntity = epicId ? doneStore.getEpic(epicId) : undefined;
if (doneEntity) {
```

- [ ] **Step 9: Verify no store.find remains in runner.ts**

Run: `grep -n 'store\.find\|\.find(' cli/src/pipeline/runner.ts`
Expected: No output (zero matches)

- [ ] **Step 10: Compile check**

Run: `cd cli && npx tsc --noEmit 2>&1 | head -30`
Expected: May have errors from test files that mock `find()`. No errors in runner.ts or reconcile.ts.

- [ ] **Step 11: Commit**

```bash
git add cli/src/pipeline/runner.ts
git commit -m "refactor(runner): use epicId for all store lookups, stop passing slug to reconcile"
```

---

### Task 3: Pipeline Runner Tests — Update Mocks

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/__tests__/pipeline-runner.test.ts`

The test file mocks `JsonFileStore` with a `find()` method. Must replace with `getEpic()`.

- [ ] **Step 1: Update mock store class**

In the `mockJsonFileStore` definition (lines 89-113), replace:

The `storeState` object:
```typescript
const storeState = {
  find: vi.fn((idOrSlug: string) => {
    if (idOrSlug === "test-epic") {
      return { id: "epic-123", slug: "test-epic", name: "Test Epic", type: "epic" };
    }
    return undefined;
  }),
  listFeatures: vi.fn((_epicId?: string) => []),
};
```

with:

```typescript
const storeState = {
  getEpic: vi.fn((id: string) => {
    if (id === "epic-123") {
      return { id: "epic-123", slug: "test-epic", name: "Test Epic", type: "epic" };
    }
    return undefined;
  }),
  listFeatures: vi.fn((_epicId?: string) => []),
};
```

The mock class:
```typescript
class JsonFileStore {
  private state = storeState;
  constructor(_path: string) {}
  load() {}
  save() {}
  find(idOrSlug: string) { return this.state.find(idOrSlug); }
  listFeatures(epicId: string) { return this.state.listFeatures(epicId); }
  updateEpic(_id: string, _patch: any) {}
}
```

with:

```typescript
class JsonFileStore {
  private state = storeState;
  constructor(_path: string) {}
  load() {}
  save() {}
  getEpic(id: string) { return this.state.getEpic(id); }
  listFeatures(epicId: string) { return this.state.listFeatures(epicId); }
  updateEpic(_id: string, _patch: any) {}
}
```

- [ ] **Step 2: Update makeConfig to include epicId**

In the `makeConfig` helper (lines 172-200), add `epicId: "epic-123"` to the default config:

```typescript
function makeConfig(overrides: Partial<PipelineConfig> = {}): PipelineConfig {
  return {
    phase: "plan",
    epicSlug: "test-epic",
    epicId: "epic-123",
    args: ["test-epic"],
    // ... rest unchanged
  };
}
```

- [ ] **Step 3: Update resetAllMocks**

In `resetAllMocks()` (around lines 271-278), replace:

```typescript
storeState.find = vi.fn((idOrSlug: string) => {
  if (idOrSlug === "test-epic") {
    return { id: "epic-123", slug: "test-epic", name: "Test Epic", type: "epic" };
  }
  return undefined;
});
```

with:

```typescript
storeState.getEpic = vi.fn((id: string) => {
  if (id === "epic-123") {
    return { id: "epic-123", slug: "test-epic", name: "Test Epic", type: "epic" };
  }
  return undefined;
});
```

- [ ] **Step 4: Update any test assertions that reference find**

Search for and update any test assertions that check `storeState.find` calls to check `storeState.getEpic` instead:

Run: `grep -n 'storeState\.find\|\.find(' cli/src/__tests__/pipeline-runner.test.ts`

Update all matches.

- [ ] **Step 5: Run tests**

Run: `cd cli && bun --bun vitest run src/__tests__/pipeline-runner.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add cli/src/__tests__/pipeline-runner.test.ts
git commit -m "test(runner): update pipeline runner mocks from find() to getEpic()"
```

---

### Task 4: Remove store.find() from Interface and Implementations

**Wave:** 3
**Depends on:** Task 1, Task 2, Task 3

**Files:**
- Modify: `cli/src/store/types.ts`
- Modify: `cli/src/store/in-memory.ts`
- Modify: `cli/src/store/json-file-store.ts`
- Modify: `cli/src/store/in-memory.test.ts`
- Modify: `cli/src/store/json-file-store.test.ts`

- [ ] **Step 1: Remove find() from TaskStore interface**

In `cli/src/store/types.ts`, remove line 100:
```typescript
  find(idOrSlug: string): Entity | undefined;
```

- [ ] **Step 2: Remove find() from InMemoryTaskStore**

In `cli/src/store/in-memory.ts`, remove the entire `find()` method (lines 281-301):
```typescript
  find(idOrSlug: string): Entity | undefined {
    // Try lookup by ID first
    const byId = this.entities.get(idOrSlug);
    if (byId) return byId;

    // Try epic slug match first (epic slugs take priority)
    for (const entity of this.entities.values()) {
      if (entity.type === "epic" && entity.slug === idOrSlug) {
        return entity;
      }
    }

    // Try feature slug match
    for (const entity of this.entities.values()) {
      if (entity.type === "feature" && entity.slug === idOrSlug) {
        return entity;
      }
    }

    return undefined;
  }
```

- [ ] **Step 3: Remove find() from JsonFileStore**

In `cli/src/store/json-file-store.ts`, remove lines 151-153:
```typescript
  find(idOrSlug: string): Entity | undefined {
    return this.inner.find(idOrSlug);
  }
```

- [ ] **Step 4: Remove find() tests from in-memory.test.ts**

In `cli/src/store/in-memory.test.ts`, remove all test cases that call `store.find()`. These are the describe/it blocks around lines 321-365 that test find-by-ID, find-by-slug, and priority resolution.

Also remove any `store.find()` calls in the slug update test (around line 92-94) — replace with `store.getEpic()`:
```typescript
// Old:
expect(store.find("new-slug")).toBeDefined();
expect(store.find("new-slug")!.id).toBe(epic.id);
expect(store.find(oldSlug)).toBeUndefined();

// New:
const updatedEpic = store.getEpic(epic.id);
expect(updatedEpic).toBeDefined();
expect(updatedEpic!.slug).toBe("new-slug");
```

- [ ] **Step 5: Remove find() tests from json-file-store.test.ts**

In `cli/src/store/json-file-store.test.ts`, remove test cases around lines 193-202 that call `store.find()`.

- [ ] **Step 6: Compile check**

Run: `cd cli && npx tsc --noEmit 2>&1 | head -40`
Expected: May show errors in other test files or modules that still use `store.find()`. Note them for Task 5.

- [ ] **Step 7: Run store unit tests**

Run: `cd cli && bun --bun vitest run src/store/in-memory.test.ts src/store/json-file-store.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add cli/src/store/types.ts cli/src/store/in-memory.ts cli/src/store/json-file-store.ts cli/src/store/in-memory.test.ts cli/src/store/json-file-store.test.ts
git commit -m "refactor(store): remove find() from TaskStore interface and implementations"
```

---

### Task 5: Fix Remaining store.find() Consumers

**Wave:** 4
**Depends on:** Task 4

**Files:**
- Modify: `cli/src/__tests__/keyboard-nav.test.ts` (4 occurrences)
- Modify: `cli/src/__tests__/cancel.test.ts` (1 occurrence)
- Modify: `cli/src/__tests__/cancel-logic.test.ts` (1 occurrence)
- Modify: `cli/src/__tests__/reconcile-in-place.integration.test.ts` (2 occurrences)
- Modify: `cli/features/store/store-dual-reference.feature` (update scenarios)
- Modify: step definitions for dual-reference if they call `find()`

These are test files that call `store.find()` which will break after Task 4 removes it. Each must be migrated to use `getEpic()` or `getFeature()`.

- [ ] **Step 1: Scan for all remaining store.find() references**

Run: `grep -rn 'store\.find\|\.find(' cli/src/__tests__/ cli/features/ --include='*.ts' --include='*.feature'`

Catalog all occurrences and plan the replacement for each.

- [ ] **Step 2: Fix keyboard-nav.test.ts**

Replace all `store.find("...")` assertions with `store.getEpic(epicId)` where `epicId` is the entity ID returned when the epic was created. Each test creates an epic and later checks it was deleted — use the epic's `.id` for the getEpic lookup.

- [ ] **Step 3: Fix cancel.test.ts**

Replace `store.find(epicSlug)` with `store.getEpic(epicId)` where `epicId` was captured from the addEpic call.

- [ ] **Step 4: Fix cancel-logic.test.ts**

Replace `store.find("my-epic")` with `store.getEpic(epicId)` where `epicId` was captured from the addEpic call.

- [ ] **Step 5: Fix reconcile-in-place.integration.test.ts**

Replace:
```typescript
const oldLookup = store.find(seeded.slug);
const newLookup = store.find("oauth-redesign-a1b2");
```
with:
```typescript
const oldLookup = store.getEpic(seeded.id);
const newLookup = store.getEpic(seeded.id);  // same entity, slug changed
```

- [ ] **Step 6: Update dual-reference step definitions**

The `store-dual-reference.feature` tests `find()` behavior. Since `find()` is being removed, either:
a) Remove the scenarios that test find() behavior, OR
b) Update them to test getEpic() and getFeature() directly

Given the BDD contract: the feature tests "Entities referenced by hash ID or human slug" — this is now split between `getEpic(id)` and `resolveIdentifier()` (CLI layer). Update the step definitions to use `getEpic()` for ID lookups and keep `resolveIdentifier()` for slug resolution.

- [ ] **Step 7: Compile check**

Run: `cd cli && npx tsc --noEmit 2>&1 | head -40`
Expected: PASS (zero errors)

- [ ] **Step 8: Run full test suite**

Run: `cd cli && bun --bun vitest run`
Expected: PASS

- [ ] **Step 9: Grep verification**

Run: `grep -rn 'store\.find(' cli/src/ --include='*.ts' | grep -v 'node_modules' | grep -v '__tests__' | grep -v '.test.ts'`
Expected: Zero matches in production code

Run: `grep -rn '\.find(' cli/src/pipeline/reconcile.ts cli/src/pipeline/runner.ts`
Expected: Zero matches

- [ ] **Step 10: Commit**

```bash
git add cli/src/__tests__/keyboard-nav.test.ts cli/src/__tests__/cancel.test.ts cli/src/__tests__/cancel-logic.test.ts cli/src/__tests__/reconcile-in-place.integration.test.ts cli/features/store/
git commit -m "refactor(tests): migrate all store.find() calls to getEpic/getFeature"
```
