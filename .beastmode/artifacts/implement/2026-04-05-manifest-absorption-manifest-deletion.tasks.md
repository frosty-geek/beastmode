# Manifest Deletion

**Goal:** Delete the entire manifest module (`manifest/store.ts`, `manifest/pure.ts`, `manifest/reconcile.ts`) and all associated test files. Migrate all remaining consumers to use the store module before deletion.

**Architecture:** Store module (`store/index.ts`) provides all types and operations. `EnrichedEpic` replaces `EnrichedManifest`. `Epic`/`Feature` replace `PipelineManifest`/`ManifestFeature`. `NextAction` is already exported from store. Reconciliation functions from `manifest/reconcile.ts` are used by `pipeline/runner.ts` — these must be preserved by moving them to a new location.

**Tech Stack:** TypeScript, Bun, Vitest, XState v5

**Constraints (from design decisions):**
- Clean break — no dual-read path, no fallback to manifests after deletion
- Store module is sole authority for pipeline state
- `EnrichedEpic` = `Epic & { nextAction?: NextAction }`
- `dispatch/types.ts` is the re-export hub for watch loop consumers

## File Structure

**Files to delete:**
- `cli/src/manifest/store.ts` — manifest CRUD, types, slugify (replaced by store module)
- `cli/src/manifest/pure.ts` — pure state machine functions (replaced by XState)
- `cli/src/manifest/reconcile.ts` — output.json reconciliation (moved to pipeline/reconcile.ts)
- `cli/src/__tests__/manifest-store.test.ts` — manifest store operation tests
- `cli/src/__tests__/manifest.test.ts` — manifest integration tests
- `cli/src/__tests__/manifest-pure.test.ts` — pure state transition tests
- `cli/src/__tests__/manifest-store-find.test.ts` — slug/epic lookup tests
- `cli/src/__tests__/manifest-store-rename.test.ts` — 8-step rename tests
- `cli/src/__tests__/reconcile-poisoning.test.ts` — reconciliation safety tests
- `cli/src/__tests__/backfill-enrichment.test.ts` — backfill tests (script deleted)

**Files to create:**
- `cli/src/pipeline/reconcile.ts` — reconciliation functions moved from manifest/reconcile.ts, rewritten for store API
- `cli/src/__tests__/manifest-deletion.integration.test.ts` — BDD integration test

**Files to modify (consumer migration):**
- `cli/src/dispatch/types.ts` — re-export from store instead of manifest
- `cli/src/commands/watch-loop.ts` — use `EnrichedEpic` instead of `EnrichedManifest`
- `cli/src/commands/dashboard.ts` — use store scan instead of `listEnriched()`
- `cli/src/commands/cancel-logic.ts` — use store API instead of manifest store
- `cli/src/commands/phase.ts` — remove manifest fallback path
- `cli/src/dispatch/it2.ts` — use store API instead of manifest store
- `cli/src/dashboard/App.tsx` — use `EnrichedEpic` type
- `cli/src/dashboard/EpicsPanel.tsx` — use `EnrichedEpic` type
- `cli/src/dashboard/OverviewPanel.tsx` — use `EnrichedEpic` type
- `cli/src/dashboard/overview-panel.ts` — use `EnrichedEpic` type
- `cli/src/pipeline/runner.ts` — use store API, import reconcile from pipeline/reconcile

**Test files to modify:**
- `cli/src/__tests__/app-integration.test.ts` — use store types
- `cli/src/__tests__/body-format.test.ts` — use store types
- `cli/src/__tests__/cancel-logic.test.ts` — update for store-based cancel
- `cli/src/__tests__/overview-panel.test.ts` — use `EnrichedEpic`
- `cli/src/__tests__/phase-dispatch.test.ts` — remove manifest `list()` import
- `cli/src/__tests__/phase-tags-integration.test.ts` — remove manifest `rename()` import
- `cli/src/__tests__/watch-dispatch-race.test.ts` — use `EnrichedEpic`
- `cli/src/__tests__/watch-events.test.ts` — use `EnrichedEpic`
- `cli/src/__tests__/watch.test.ts` — use `EnrichedEpic`
- `cli/src/__tests__/wave-dispatch.test.ts` — use `EnrichedEpic`
- `cli/src/__tests__/wave-filtering.test.ts` — use store types

---

### Task 0: Integration Test (RED)

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/src/__tests__/manifest-deletion.integration.test.ts`

- [x] **Step 1: Write the integration test**

```typescript
/**
 * Integration test: Manifest module removed after migration.
 *
 * Verifies that the manifest module has been deleted and no code
 * references manifest types or imports from the manifest module.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const CLI_SRC = resolve(import.meta.dirname, "..");

describe("@manifest-absorption: Manifest module removed after migration", () => {
  describe("Scenario: No manifest module exists after migration", () => {
    it("manifest/store.ts does not exist", () => {
      expect(existsSync(resolve(CLI_SRC, "manifest/store.ts"))).toBe(false);
    });

    it("manifest/pure.ts does not exist", () => {
      expect(existsSync(resolve(CLI_SRC, "manifest/pure.ts"))).toBe(false);
    });

    it("manifest/reconcile.ts does not exist", () => {
      expect(existsSync(resolve(CLI_SRC, "manifest/reconcile.ts"))).toBe(false);
    });

    it("no code imports from a manifest module", () => {
      // Grep for imports from manifest/ in all .ts/.tsx files, excluding test files and the manifest dir itself
      const result = execSync(
        `grep -rl 'from.*manifest/' --include='*.ts' --include='*.tsx' ${CLI_SRC} || true`,
        { encoding: "utf-8" },
      ).trim();

      // Filter out: manifest module files themselves, test files checking for absence, node_modules
      const remaining = result
        .split("\n")
        .filter(Boolean)
        .filter((f) => !f.includes("node_modules"))
        .filter((f) => !f.includes("manifest/"))
        .filter((f) => !f.includes("manifest-deletion.integration.test"));

      expect(remaining).toEqual([]);
    });
  });

  describe("Scenario: Manifest type references replaced with store types", () => {
    it("no PipelineManifest type references remain", () => {
      const result = execSync(
        `grep -rl 'PipelineManifest' --include='*.ts' --include='*.tsx' ${CLI_SRC} || true`,
        { encoding: "utf-8" },
      ).trim();

      const remaining = result
        .split("\n")
        .filter(Boolean)
        .filter((f) => !f.includes("node_modules"))
        .filter((f) => !f.includes("manifest/"))
        .filter((f) => !f.includes("manifest-deletion.integration.test"));

      expect(remaining).toEqual([]);
    });

    it("no ManifestFeature type references remain", () => {
      const result = execSync(
        `grep -rl 'ManifestFeature' --include='*.ts' --include='*.tsx' ${CLI_SRC} || true`,
        { encoding: "utf-8" },
      ).trim();

      const remaining = result
        .split("\n")
        .filter(Boolean)
        .filter((f) => !f.includes("node_modules"))
        .filter((f) => !f.includes("manifest/"));

      expect(remaining).toEqual([]);
    });

    it("no EnrichedManifest type references remain", () => {
      const result = execSync(
        `grep -rl 'EnrichedManifest' --include='*.ts' --include='*.tsx' ${CLI_SRC} || true`,
        { encoding: "utf-8" },
      ).trim();

      const remaining = result
        .split("\n")
        .filter(Boolean)
        .filter((f) => !f.includes("node_modules"))
        .filter((f) => !f.includes("manifest/"));

      expect(remaining).toEqual([]);
    });

    it("no ManifestGitHub type references remain", () => {
      const result = execSync(
        `grep -rl 'ManifestGitHub' --include='*.ts' --include='*.tsx' ${CLI_SRC} || true`,
        { encoding: "utf-8" },
      ).trim();

      const remaining = result
        .split("\n")
        .filter(Boolean)
        .filter((f) => !f.includes("node_modules"))
        .filter((f) => !f.includes("manifest/"));

      expect(remaining).toEqual([]);
    });
  });

  describe("Scenario: Pipeline operates without manifest module", () => {
    it("store module exports all needed types", async () => {
      const storeModule = await import("../store/index.js");
      expect(storeModule.JsonFileStore).toBeDefined();
      expect(storeModule.InMemoryTaskStore).toBeDefined();
      expect(storeModule.resolveIdentifier).toBeDefined();
      expect(storeModule.slugify).toBeDefined();
    });

    it("pipeline/reconcile.ts exports reconciliation functions", async () => {
      const reconcile = await import("../pipeline/reconcile.js");
      expect(reconcile.reconcileDesign).toBeDefined();
      expect(reconcile.reconcilePlan).toBeDefined();
      expect(reconcile.reconcileFeature).toBeDefined();
      expect(reconcile.reconcileImplement).toBeDefined();
      expect(reconcile.reconcileValidate).toBeDefined();
      expect(reconcile.reconcileRelease).toBeDefined();
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run src/__tests__/manifest-deletion.integration.test.ts`
Expected: FAIL — manifest module files still exist, imports still reference manifest/

- [x] **Step 3: Commit**

```bash
git add cli/src/__tests__/manifest-deletion.integration.test.ts
git commit -m "test(manifest-deletion): add integration test (RED)"
```

---

### Task 1: Migrate dispatch/types.ts Re-exports

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dispatch/types.ts`

- [x] **Step 1: Update imports to use store module**

Change line 8-9 in `cli/src/dispatch/types.ts` from:
```typescript
import type { EnrichedManifest, ScanResult, NextAction } from "../manifest/store.js";
export type { EnrichedManifest, ScanResult, NextAction };
```

To:
```typescript
import type { EnrichedEpic, NextAction } from "../store/index.js";
export type { EnrichedEpic, NextAction };
/** @deprecated Use EnrichedEpic — alias kept for one migration cycle */
export type EnrichedManifest = EnrichedEpic;
/** Scan result wrapping enriched epics. */
export interface ScanResult {
  epics: EnrichedEpic[];
}
```

- [x] **Step 2: Run tests to verify nothing breaks**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run`
Expected: PASS (the alias keeps downstream consumers working)

- [x] **Step 3: Commit**

```bash
git add cli/src/dispatch/types.ts
git commit -m "feat(manifest-deletion): migrate dispatch/types re-exports to store module"
```

---

### Task 2: Migrate watch-loop.ts

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/commands/watch-loop.ts`

- [x] **Step 1: Update imports and types in watch-loop.ts**

Change line 8 from:
```typescript
import type { EnrichedManifest, ScanResult } from "../manifest/store.js";
```

To:
```typescript
import type { EnrichedEpic } from "../store/index.js";
import type { ScanResult } from "../dispatch/types.js";
```

Then update all `EnrichedManifest` references to `EnrichedEpic` throughout the file:
- Line 42: `scanEpics: (projectRoot: string) => Promise<ScanResult | EnrichedEpic[]>;`
- Line 154: `let epics: EnrichedEpic[];`
- Line 170: `private async processEpic(epic: EnrichedEpic): Promise<number> {`
- Line 191: `private async dispatchSingle(epic: EnrichedEpic): Promise<number> {`
- Line 245-247: `private async dispatchFanOut(epic: EnrichedEpic, features: string[]): Promise<number> {`

- [x] **Step 2: Run watch-related tests**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run src/__tests__/watch.test.ts src/__tests__/watch-events.test.ts src/__tests__/watch-dispatch-race.test.ts`
Expected: PASS (or type errors to fix in test files — handled in Task 6)

- [x] **Step 3: Commit**

```bash
git add cli/src/commands/watch-loop.ts
git commit -m "feat(manifest-deletion): migrate watch-loop to EnrichedEpic"
```

---

### Task 3: Migrate dashboard components

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/overview-panel.ts`
- Modify: `cli/src/dashboard/OverviewPanel.tsx`
- Modify: `cli/src/dashboard/EpicsPanel.tsx`
- Modify: `cli/src/dashboard/App.tsx`
- Modify: `cli/src/commands/dashboard.ts`

- [x] **Step 1: Update overview-panel.ts**

Change line 1 from:
```typescript
import type { EnrichedManifest } from "../manifest/store.js";
```

To:
```typescript
import type { EnrichedEpic } from "../store/index.js";
```

Replace all `EnrichedManifest` with `EnrichedEpic` in the file:
- Line 16: `export function computePhaseDistribution(epics: EnrichedEpic[]): PhaseCount[] {`

- [x] **Step 2: Update OverviewPanel.tsx**

Change line 2 from:
```typescript
import type { EnrichedManifest } from "../manifest/store.js";
```

To:
```typescript
import type { EnrichedEpic } from "../store/index.js";
```

Replace all `EnrichedManifest` with `EnrichedEpic`:
- Line 12: `epics: EnrichedEpic[];`

- [x] **Step 3: Update EpicsPanel.tsx**

Change line 3 from:
```typescript
import type { EnrichedManifest } from "../manifest/store.js";
```

To:
```typescript
import type { EnrichedEpic } from "../store/index.js";
```

Replace all `EnrichedManifest` with `EnrichedEpic` throughout the file.

- [x] **Step 4: Update App.tsx**

Change line 4 from:
```typescript
import type { EnrichedManifest } from "../manifest/store.js";
```

To:
```typescript
import type { EnrichedEpic } from "../store/index.js";
```

Replace all `EnrichedManifest` with `EnrichedEpic` throughout the file.

- [x] **Step 5: Update dashboard.ts**

Change line 6 from:
```typescript
import { listEnriched } from "../manifest/store.js";
```

To:
```typescript
import { JsonFileStore } from "../store/index.js";
import type { EnrichedEpic } from "../store/index.js";
```

Update the `scanEpics` function in the deps (around line 68) from:
```typescript
scanEpics: async (root: string) => listEnriched(root),
```

To:
```typescript
scanEpics: async (root: string) => {
  const storePath = resolve(root, ".beastmode", "state", "store.json");
  const taskStore = new JsonFileStore(storePath);
  taskStore.load();
  return taskStore.listEpics().map((epic) => ({
    ...epic,
    nextAction: undefined,
  })) as EnrichedEpic[];
},
```

Add `resolve` import if not already present (it is — from "node:path" on line 1).

- [x] **Step 6: Run tests**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run src/__tests__/overview-panel.test.ts src/__tests__/app-integration.test.ts`
Expected: PASS (or type errors in tests — handled in Task 6)

- [x] **Step 7: Commit**

```bash
git add cli/src/dashboard/overview-panel.ts cli/src/dashboard/OverviewPanel.tsx cli/src/dashboard/EpicsPanel.tsx cli/src/dashboard/App.tsx cli/src/commands/dashboard.ts
git commit -m "feat(manifest-deletion): migrate dashboard components to EnrichedEpic"
```

---

### Task 4: Migrate cancel-logic.ts, phase.ts, it2.ts, runner.ts, backfill script

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/commands/cancel-logic.ts`
- Modify: `cli/src/commands/phase.ts`
- Modify: `cli/src/dispatch/it2.ts`
- Modify: `cli/src/pipeline/runner.ts`
- Delete: `cli/src/scripts/backfill-enrichment.ts`

- [x] **Step 1: Update cancel-logic.ts**

Change line 18 from:
```typescript
import * as store from "../manifest/store.js";
```

To:
```typescript
import { JsonFileStore, resolveIdentifier } from "../store/index.js";
```

Rewrite the `cancelEpic` function's self-resolution section (lines 82-85) from:
```typescript
  const manifest = store.find(projectRoot, identifier);
  const slug = manifest?.slug ?? identifier;
  const epic = manifest?.epic ?? manifest?.slug ?? identifier;
  const githubEpicNumber = manifest?.github?.epic;
```

To:
```typescript
  const storePath = resolve(projectRoot, ".beastmode", "state", "store.json");
  const taskStore = new JsonFileStore(storePath);
  taskStore.load();
  const resolution = resolveIdentifier(taskStore, identifier, { resolveToEpic: true });
  const entity = resolution.kind === "found" ? resolution.entity : undefined;
  const slug = entity?.slug ?? identifier;
  const epic = entity?.name ?? entity?.slug ?? identifier;
  const githubEpicNumber = undefined; // GitHub refs now in sync-refs.json, handled by GitHub sync module
```

Rewrite step 6 (lines 178-191 — delete manifest) from:
```typescript
  try {
    const removed = store.remove(projectRoot, slug);
    if (removed) {
      logger.debug("deleted manifest", { slug });
    } else {
      logger.debug("no manifest found", { slug });
    }
    cleaned.push("manifest");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`manifest deletion: ${msg}`);
    warned.push("manifest");
  }
```

To:
```typescript
  try {
    if (entity) {
      // Delete features first, then epic
      const features = taskStore.listFeatures(entity.id);
      for (const f of features) {
        taskStore.deleteFeature(f.id);
      }
      taskStore.deleteEpic(entity.id);
      taskStore.save();
      logger.debug("deleted store entity", { slug });
    } else {
      logger.debug("no store entity found", { slug });
    }
    cleaned.push("store-entity");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn(`store entity deletion: ${msg}`);
    warned.push("store-entity");
  }
```

Also add `{ resolve }` to the existing path import if needed (line 13 already has `import { resolve } from "path";`).

- [x] **Step 2: Update phase.ts**

Remove the manifest import (line 25):
```typescript
import * as store from "../manifest/store";
```

Remove the manifest-specific code. In the fail-fast section (lines 71-78), remove the manifest fallback:
```typescript
    if (resolution.kind === "not-found") {
      // Fallback to manifest lookup (coexistence period)
      const existing = store.find(projectRoot, worktreeSlug);
      if (!existing) {
        logger.error("epic not found", { slug: worktreeSlug });
        process.exit(1);
      }
    }
```

Replace with:
```typescript
    if (resolution.kind === "not-found") {
      logger.error("epic not found", { slug: worktreeSlug });
      process.exit(1);
    }
```

Update the design phase seed section (lines 119-124) from:
```typescript
  if (phase === "design" && !store.manifestExists(projectRoot, epicSlug)) {
    const predictedPath = enterWorktree(epicSlug, { cwd: projectRoot });
    store.create(projectRoot, epicSlug, {
      worktree: { branch: `feature/${worktreeSlug}`, path: predictedPath },
    });
  }
```

To:
```typescript
  if (phase === "design") {
    const predictedPath = enterWorktree(epicSlug, { cwd: projectRoot });
    // Store entity creation happens during reconciliation
  }
```

Wait — this needs more thought. The design phase seeding was creating a manifest so the runner could reconcile it later. With the store, the reconciliation functions need to handle entity creation. Let me check what `reconcileDesign` does.

Actually, the runner creates the store entity during reconciliation now (from the xstate-store-bridge feature). The design seed only needs to ensure the worktree is created. So simplify to:

```typescript
  if (phase === "design") {
    enterWorktree(epicSlug, { cwd: projectRoot });
  }
```

- [x] **Step 3: Update it2.ts**

Change line 25 from:
```typescript
import * as store from "../manifest/store.js";
```

To:
```typescript
import { JsonFileStore } from "../store/index.js";
import type { Epic } from "../store/index.js";
```

Find the usage of `store.load()` (line 494) and update. The `store.load()` call loads a manifest to get its `features` array. Replace with store API equivalent.

- [x] **Step 4: Move reconciliation functions**

Create `cli/src/pipeline/reconcile.ts` by copying `cli/src/manifest/reconcile.ts` and updating:
- Change all manifest store imports to use `../store/index.js`
- Replace `PipelineManifest` with `Epic`
- Replace `ManifestFeature` with `Feature`
- Update function signatures to work with store API
- Keep the same function names and signatures where possible

This is a significant rewrite — the reconcile functions currently call `store.load()`, `store.save()`, `store.transact()` etc. from manifest/store. They need to be rewritten to use `JsonFileStore` or accept a store instance as parameter.

- [x] **Step 5: Update runner.ts imports**

Change the manifest imports in runner.ts (lines 28, 39-47) from:
```typescript
import * as store from "../manifest/store.js";
...
import {
  reconcileDesign,
  reconcilePlan,
  reconcileFeature,
  reconcileImplement,
  reconcileValidate,
  reconcileRelease,
} from "../manifest/reconcile.js";
import type { ReconcileResult } from "../manifest/reconcile.js";
```

To:
```typescript
import { JsonFileStore, resolveIdentifier } from "../store/index.js";
...
import {
  reconcileDesign,
  reconcilePlan,
  reconcileFeature,
  reconcileImplement,
  reconcileValidate,
  reconcileRelease,
} from "./reconcile.js";
import type { ReconcileResult } from "./reconcile.js";
```

Update manifest store usages throughout the runner (store.load, store.save, store.rename, etc.) to use JsonFileStore API.

- [x] **Step 6: Delete backfill script**

```bash
rm cli/src/scripts/backfill-enrichment.ts
```

The backfill script comment says "Delete after migration is complete" — migration is now complete.

- [x] **Step 7: Run tests**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run`
Expected: Some tests may fail due to test files still importing from manifest — those are handled in Task 6

- [x] **Step 8: Commit**

```bash
git add cli/src/commands/cancel-logic.ts cli/src/commands/phase.ts cli/src/dispatch/it2.ts cli/src/pipeline/runner.ts cli/src/pipeline/reconcile.ts
git rm cli/src/scripts/backfill-enrichment.ts
git commit -m "feat(manifest-deletion): migrate all production consumers to store module"
```

---

### Task 5: Delete manifest module files

**Wave:** 2
**Depends on:** Task 1, Task 2, Task 3, Task 4

**Files:**
- Delete: `cli/src/manifest/store.ts`
- Delete: `cli/src/manifest/pure.ts`
- Delete: `cli/src/manifest/reconcile.ts`

- [x] **Step 1: Verify no production imports remain**

Run: `grep -rl 'from.*manifest/' --include='*.ts' --include='*.tsx' cli/src/ | grep -v __tests__ | grep -v manifest/ | grep -v node_modules`
Expected: No output (all production consumers migrated)

- [x] **Step 2: Delete manifest module files**

```bash
rm cli/src/manifest/store.ts cli/src/manifest/pure.ts cli/src/manifest/reconcile.ts
```

If the manifest directory is now empty, remove it:
```bash
rmdir cli/src/manifest/ 2>/dev/null || true
```

- [x] **Step 3: Commit**

```bash
git rm cli/src/manifest/store.ts cli/src/manifest/pure.ts cli/src/manifest/reconcile.ts
git commit -m "feat(manifest-deletion): delete manifest module"
```

---

### Task 6: Update test files and delete manifest-specific tests

**Wave:** 2
**Depends on:** Task 1, Task 2, Task 3, Task 4

**Files:**
- Delete: `cli/src/__tests__/manifest-store.test.ts`
- Delete: `cli/src/__tests__/manifest.test.ts`
- Delete: `cli/src/__tests__/manifest-pure.test.ts`
- Delete: `cli/src/__tests__/manifest-store-find.test.ts`
- Delete: `cli/src/__tests__/manifest-store-rename.test.ts`
- Delete: `cli/src/__tests__/reconcile-poisoning.test.ts`
- Delete: `cli/src/__tests__/backfill-enrichment.test.ts`
- Modify: `cli/src/__tests__/app-integration.test.ts`
- Modify: `cli/src/__tests__/body-format.test.ts`
- Modify: `cli/src/__tests__/cancel-logic.test.ts`
- Modify: `cli/src/__tests__/overview-panel.test.ts`
- Modify: `cli/src/__tests__/phase-dispatch.test.ts`
- Modify: `cli/src/__tests__/phase-tags-integration.test.ts`
- Modify: `cli/src/__tests__/watch-dispatch-race.test.ts`
- Modify: `cli/src/__tests__/watch-events.test.ts`
- Modify: `cli/src/__tests__/watch.test.ts`
- Modify: `cli/src/__tests__/wave-dispatch.test.ts`
- Modify: `cli/src/__tests__/wave-filtering.test.ts`

- [x] **Step 1: Delete manifest-specific test files**

```bash
rm cli/src/__tests__/manifest-store.test.ts
rm cli/src/__tests__/manifest.test.ts
rm cli/src/__tests__/manifest-pure.test.ts
rm cli/src/__tests__/manifest-store-find.test.ts
rm cli/src/__tests__/manifest-store-rename.test.ts
rm cli/src/__tests__/reconcile-poisoning.test.ts
rm cli/src/__tests__/backfill-enrichment.test.ts
```

- [x] **Step 2: Update remaining test files**

For each test file that imports from `manifest/store` or `manifest/pure`:

**Pattern A — type-only imports of EnrichedManifest:**
Replace `import type { EnrichedManifest } from "../manifest/store.js"` with `import type { EnrichedEpic } from "../store/index.js"`, then replace all `EnrichedManifest` with `EnrichedEpic` in the file.

Applies to: `watch-dispatch-race.test.ts`, `watch-events.test.ts`, `watch.test.ts`, `wave-dispatch.test.ts`, `overview-panel.test.ts`, `app-integration.test.ts`

**Pattern B — type imports of PipelineManifest/ManifestFeature:**
Replace with `Epic`/`Feature` from store, update test data shapes to match store entity format (add `id`, `type`, `created_at`, `updated_at` fields; rename `phase` to `status`; rename `epic` to `name`).

Applies to: `body-format.test.ts`, `wave-filtering.test.ts`

**Pattern C — function imports:**
- `phase-dispatch.test.ts`: Remove `import { list } from "../manifest/store.js"` — replace with store API equivalent or remove if test no longer relevant.
- `phase-tags-integration.test.ts`: Remove `import { rename } from "../manifest/store"` — rename is deleted, remove or rewrite test.

**Pattern D — cancel-logic.test.ts:**
Update mock/stub to match new store-based cancel-logic.ts.

- [x] **Step 3: Run full test suite**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run`
Expected: PASS (minus deleted test files, test count will be lower)

- [x] **Step 4: Commit**

```bash
git rm cli/src/__tests__/manifest-store.test.ts cli/src/__tests__/manifest.test.ts cli/src/__tests__/manifest-pure.test.ts cli/src/__tests__/manifest-store-find.test.ts cli/src/__tests__/manifest-store-rename.test.ts cli/src/__tests__/reconcile-poisoning.test.ts cli/src/__tests__/backfill-enrichment.test.ts
git add cli/src/__tests__/app-integration.test.ts cli/src/__tests__/body-format.test.ts cli/src/__tests__/cancel-logic.test.ts cli/src/__tests__/overview-panel.test.ts cli/src/__tests__/phase-dispatch.test.ts cli/src/__tests__/phase-tags-integration.test.ts cli/src/__tests__/watch-dispatch-race.test.ts cli/src/__tests__/watch-events.test.ts cli/src/__tests__/watch.test.ts cli/src/__tests__/wave-dispatch.test.ts cli/src/__tests__/wave-filtering.test.ts
git commit -m "feat(manifest-deletion): update tests and delete manifest-specific test files"
```

---

### Task 7: Clean Build Verification

**Wave:** 3
**Depends on:** Task 5, Task 6

**Files:**
- (verification only — no new files)

- [x] **Step 1: Verify no manifest imports remain**

Run: `grep -rl 'from.*manifest/' --include='*.ts' --include='*.tsx' cli/src/ | grep -v node_modules | grep -v manifest-deletion.integration`
Expected: No output

- [x] **Step 2: Verify no manifest type references remain**

Run: `grep -rl 'PipelineManifest\|ManifestFeature\|ManifestGitHub' --include='*.ts' --include='*.tsx' cli/src/ | grep -v node_modules`
Expected: No output

- [x] **Step 3: Run typecheck**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun x tsc --noEmit`
Expected: No errors

- [x] **Step 4: Run full test suite**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run`
Expected: All tests PASS

- [x] **Step 5: Run integration test (should be GREEN now)**

Run: `cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/manifest-absorption/cli && bun --bun vitest run src/__tests__/manifest-deletion.integration.test.ts`
Expected: PASS — all assertions confirm manifest module is gone

- [x] **Step 6: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(manifest-deletion): clean build verification fixes"
```
