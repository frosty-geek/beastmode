# GitHub Sync Separation — Implementation Tasks

## Goal

Extract GitHub issue tracking into a dedicated sync file (`github-sync.json`) and rewrite the sync module to consume store entities instead of `PipelineManifest`. Pipeline state and sync state get clear ownership boundaries.

## Architecture

- **Sync file**: `.beastmode/state/github-sync.json` — `Record<entityId, { issue: number; bodyHash?: string }>`
- **Sync file I/O module**: `cli/src/github/sync-refs.ts` — `loadSyncRefs()`, `saveSyncRefs()`, `getSyncRef()`, `setSyncRef()`
- **Rewritten modules**: `sync.ts`, `early-issues.ts`, `commit-issue-ref.ts` — read pipeline state from store, GitHub refs from sync file
- **Deleted callers**: `setGitHubEpic`, `setFeatureGitHubIssue`, `setEpicBodyHash`, `setFeatureBodyHash` from `manifest/pure.ts` no longer called
- **Runner step 8**: reads store + sync file instead of manifest
- **Body formatting**: accepts store Epic/Feature types, sync refs for issue numbers

## Tech Stack

- TypeScript, Bun runtime, Vitest for tests
- Store API: `JsonFileStore` with `TaskStore` interface
- Test command: `bun --bun vitest run`

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `cli/src/github/sync-refs.ts` | Create | Sync file I/O: load/save/get/set for github-sync.json |
| `cli/src/github/sync-refs.test.ts` | Create | Unit tests for sync-refs module |
| `cli/src/github/sync.ts` | Modify | Rewrite syncGitHub/syncGitHubForEpic to accept store Epic + features + sync refs |
| `cli/src/github/early-issues.ts` | Modify | Rewrite to read/write sync file, not manifest |
| `cli/src/git/commit-issue-ref.ts` | Modify | Rewrite to read issue numbers from sync refs |
| `cli/src/pipeline/runner.ts` | Modify | Step 8: apply sync mutations to sync file, not manifest |
| `cli/src/__tests__/github-sync.test.ts` | Modify | Update tests for new store-based API |
| `cli/src/__tests__/commit-issue-ref.test.ts` | Modify | Update tests for new sync-refs API |

---

### Task 0: Integration Test (BDD)

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/src/__tests__/github-sync-separation.integration.test.ts`

- [ ] **Step 1: Write integration test from Gherkin scenarios**

```typescript
/**
 * Integration test: GitHub sync state separated from pipeline state.
 *
 * Verifies that GitHub issue numbers and body hashes are stored in a
 * dedicated sync file, not on store entities.
 */

import { describe, test, expect, beforeEach } from "vitest";
import { InMemoryTaskStore } from "../store/in-memory";
import type { Epic, Feature } from "../store/types";

// Import sync-refs module (will be created in Task 1)
// These imports will fail until Task 1 completes — expected RED state.

describe("GitHub sync state separated from pipeline state", () => {
  let store: InMemoryTaskStore;
  let epic: Epic;

  beforeEach(() => {
    store = new InMemoryTaskStore();
    epic = store.addEpic({ name: "Auth System", slug: "auth-system" });
  });

  test("GitHub issue number stored in sync file, not on store entity", async () => {
    // Given a store is initialized and an epic exists (beforeEach)
    // When a GitHub issue is created for epic "auth-system"
    const { loadSyncRefs, saveSyncRefs, setSyncRef, getSyncRef } = await import("../github/sync-refs");

    const refs: Record<string, { issue: number; bodyHash?: string }> = {};
    const updatedRefs = setSyncRef(refs, epic.id, { issue: 42 });

    // Then the issue number is recorded in the sync file
    const ref = getSyncRef(updatedRefs, epic.id);
    expect(ref).toBeDefined();
    expect(ref!.issue).toBe(42);

    // And the epic entity in the store does not carry the issue number
    const freshEpic = store.getEpic(epic.id);
    expect(freshEpic).toBeDefined();
    expect((freshEpic as any).github).toBeUndefined();
  });

  test("GitHub sync module reads pipeline state from store", async () => {
    // Given epic "auth-system" is at phase "plan" in the store
    store.updateEpic(epic.id, { status: "plan" });
    const { setSyncRef } = await import("../github/sync-refs");

    const refs = setSyncRef({}, epic.id, { issue: 10 });

    // When the GitHub sync module enriches the epic issue body
    const { formatEpicBody } = await import("../github/sync");
    const freshEpic = store.getEpic(epic.id)!;
    const features = store.listFeatures(epic.id);

    const body = formatEpicBody({
      slug: freshEpic.slug,
      epic: freshEpic.name,
      phase: freshEpic.status as any,
      summary: freshEpic.summary as any,
      features: features.map((f) => ({
        slug: f.slug,
        status: f.status,
        github: refs[f.id] ? { issue: refs[f.id].issue } : undefined,
      })),
    });

    // Then it reads the phase from the store entity
    expect(body).toContain("plan");
    // And it reads the issue number from the sync file
    expect(refs[epic.id].issue).toBe(10);
  });

  test("Feature issue numbers stored in sync file", async () => {
    // Given a feature "login-flow" exists under "auth-system"
    const feature = store.addFeature({
      parent: epic.id,
      name: "Login Flow",
      slug: "login-flow",
    });

    const { setSyncRef, getSyncRef } = await import("../github/sync-refs");

    // When a GitHub issue is created for feature "login-flow"
    const refs = setSyncRef({}, feature.id, { issue: 55 });

    // Then the feature issue number is recorded in the sync file
    const ref = getSyncRef(refs, feature.id);
    expect(ref).toBeDefined();
    expect(ref!.issue).toBe(55);

    // And the feature entity in the store does not carry the issue number
    const freshFeature = store.getFeature(feature.id);
    expect((freshFeature as any).github).toBeUndefined();
  });

  test("Sync file is independent from store transactions", async () => {
    // Given epic "auth-system" has a GitHub issue recorded in the sync file
    const { setSyncRef, getSyncRef } = await import("../github/sync-refs");
    const refs = setSyncRef({}, epic.id, { issue: 10 });

    // When the epic status is updated in the store
    store.updateEpic(epic.id, { status: "implement" });

    // Then the sync file is not modified by the store transaction
    // (refs is a separate object, not tied to store)
    const ref = getSyncRef(refs, epic.id);
    expect(ref!.issue).toBe(10);

    // And the sync file retains the existing issue reference
    expect(Object.keys(refs)).toHaveLength(1);
  });

  test("Body hash tracked in sync file for idempotent updates", async () => {
    // Given epic "auth-system" has a GitHub issue with an enriched body
    const { setSyncRef, getSyncRef } = await import("../github/sync-refs");
    let refs = setSyncRef({}, epic.id, { issue: 10, bodyHash: "abc123" });

    // When the sync module checks whether the body needs updating
    const ref = getSyncRef(refs, epic.id);

    // Then it compares the current body hash from the sync file
    expect(ref!.bodyHash).toBe("abc123");

    // And it skips the update if the hash matches
    const currentHash = "abc123";
    expect(ref!.bodyHash === currentHash).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails (RED)**

Run: `cd cli && bun --bun vitest run src/__tests__/github-sync-separation.integration.test.ts`
Expected: FAIL — `sync-refs` module does not exist yet

---

### Task 1: Sync File I/O Module

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/src/github/sync-refs.ts`
- Create: `cli/src/__tests__/sync-refs.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
/**
 * Unit tests for sync-refs — GitHub sync file I/O.
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  loadSyncRefs,
  saveSyncRefs,
  getSyncRef,
  setSyncRef,
  type SyncRefs,
} from "../github/sync-refs";

describe("sync-refs", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sync-refs-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getSyncRef / setSyncRef (pure)", () => {
    test("returns undefined for missing entity", () => {
      const refs: SyncRefs = {};
      expect(getSyncRef(refs, "bm-1234")).toBeUndefined();
    });

    test("sets and gets a sync ref", () => {
      let refs: SyncRefs = {};
      refs = setSyncRef(refs, "bm-1234", { issue: 42 });
      const ref = getSyncRef(refs, "bm-1234");
      expect(ref).toEqual({ issue: 42 });
    });

    test("sets ref with bodyHash", () => {
      let refs: SyncRefs = {};
      refs = setSyncRef(refs, "bm-1234", { issue: 42, bodyHash: "abc" });
      expect(getSyncRef(refs, "bm-1234")).toEqual({ issue: 42, bodyHash: "abc" });
    });

    test("overwrites existing ref", () => {
      let refs: SyncRefs = {};
      refs = setSyncRef(refs, "bm-1234", { issue: 42 });
      refs = setSyncRef(refs, "bm-1234", { issue: 99, bodyHash: "xyz" });
      expect(getSyncRef(refs, "bm-1234")).toEqual({ issue: 99, bodyHash: "xyz" });
    });

    test("setSyncRef returns a new object (immutable)", () => {
      const refs: SyncRefs = {};
      const updated = setSyncRef(refs, "bm-1234", { issue: 42 });
      expect(refs).toEqual({});
      expect(updated).toEqual({ "bm-1234": { issue: 42 } });
    });
  });

  describe("loadSyncRefs / saveSyncRefs (I/O)", () => {
    test("returns empty object when file does not exist", () => {
      const refs = loadSyncRefs(tmpDir);
      expect(refs).toEqual({});
    });

    test("round-trips save then load", () => {
      const refs: SyncRefs = {
        "bm-1234": { issue: 42 },
        "bm-5678": { issue: 99, bodyHash: "abc" },
      };
      saveSyncRefs(tmpDir, refs);
      const loaded = loadSyncRefs(tmpDir);
      expect(loaded).toEqual(refs);
    });

    test("saves to .beastmode/state/github-sync.json", () => {
      saveSyncRefs(tmpDir, { "bm-1": { issue: 1 } });
      const filePath = join(tmpDir, ".beastmode", "state", "github-sync.json");
      const content = JSON.parse(readFileSync(filePath, "utf-8"));
      expect(content).toEqual({ "bm-1": { issue: 1 } });
    });

    test("handles empty refs object", () => {
      saveSyncRefs(tmpDir, {});
      const loaded = loadSyncRefs(tmpDir);
      expect(loaded).toEqual({});
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cli && bun --bun vitest run src/__tests__/sync-refs.test.ts`
Expected: FAIL — module `../github/sync-refs` does not exist

- [ ] **Step 3: Write the sync-refs module**

```typescript
/**
 * GitHub Sync Refs — I/O for github-sync.json.
 *
 * Stores GitHub issue numbers and body hashes in a dedicated file,
 * separate from the pipeline store. The GitHub sync module is the
 * sole reader/writer of this file.
 *
 * Schema: Record<entityId, { issue: number; bodyHash?: string }>
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";

/** A single entity's GitHub sync reference. */
export interface SyncRef {
  issue: number;
  bodyHash?: string;
}

/** The full sync refs map — keyed by entity ID. */
export type SyncRefs = Record<string, SyncRef>;

const SYNC_FILE = ".beastmode/state/github-sync.json";

/**
 * Load sync refs from disk. Returns empty object if file doesn't exist.
 */
export function loadSyncRefs(projectRoot: string): SyncRefs {
  const filePath = join(projectRoot, SYNC_FILE);
  if (!existsSync(filePath)) return {};

  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as SyncRefs;
  } catch {
    return {};
  }
}

/**
 * Save sync refs to disk. Creates parent directories if needed.
 */
export function saveSyncRefs(projectRoot: string, refs: SyncRefs): void {
  const filePath = join(projectRoot, SYNC_FILE);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, JSON.stringify(refs, null, 2) + "\n", "utf-8");
}

/**
 * Get a sync ref for a specific entity. Returns undefined if not found.
 */
export function getSyncRef(refs: SyncRefs, entityId: string): SyncRef | undefined {
  return refs[entityId];
}

/**
 * Set a sync ref for a specific entity. Returns a new refs object (immutable).
 */
export function setSyncRef(refs: SyncRefs, entityId: string, ref: SyncRef): SyncRefs {
  return { ...refs, [entityId]: ref };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/__tests__/sync-refs.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/github/sync-refs.ts cli/src/__tests__/sync-refs.test.ts
git commit -m "feat(github-sync-separation): add sync-refs I/O module"
```

---

### Task 2: Rewrite sync.ts — Change syncGitHub Signature

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/github/sync.ts`
- Modify: `cli/src/__tests__/github-sync.test.ts`

This task rewrites `syncGitHub()` to accept store entities + sync refs instead of `PipelineManifest`. The `SyncMutation` type changes to target sync refs instead of manifest fields. `syncGitHubForEpic()` is rewritten to load store + sync refs.

The body formatting functions (`formatEpicBody`, `formatFeatureBody`, `epicTitle`, `featureTitle`) already use decoupled input types (`EpicBodyInput`, `FeatureBodyInput`) — they don't need signature changes.

The key changes:
1. `syncGitHub()` signature: accepts `EpicSyncInput` (store-derived) + `SyncRefs` instead of `PipelineManifest`
2. `SyncMutation` targets sync refs, not manifest
3. `syncGitHubForEpic()` loads store + sync file, applies mutations to sync file
4. Remove imports from `manifest/pure.js` and `manifest/store.js`

- [ ] **Step 1: Write failing tests for the new syncGitHub signature**

Update the test helpers in `github-sync.test.ts` to construct store-shaped inputs:

```typescript
// In github-sync.test.ts, update imports and helpers:

// Replace:
// import type { PipelineManifest, ManifestFeature } from "../manifest/pure";
// With:
import type { SyncRefs } from "../github/sync-refs";

// Add new input type import:
import type { EpicSyncInput, FeatureSyncInput } from "../github/sync";

// Replace makeManifest with makeEpicInput:
function makeEpicInput(overrides: Partial<EpicSyncInput> = {}): EpicSyncInput {
  return {
    id: "bm-1234",
    slug: "test-epic",
    name: "Test Epic",
    phase: "design",
    features: [],
    artifacts: {},
    ...overrides,
  };
}

// Replace makeFeature with makeFeatureInput:
function makeFeatureInput(overrides: Partial<FeatureSyncInput> = {}): FeatureSyncInput {
  return {
    id: "bm-1234.1",
    slug: "feat-a",
    status: "pending",
    plan: "plan-a.md",
    ...overrides,
  };
}

// Replace makeSyncRefs helper:
function makeSyncRefs(overrides: Partial<SyncRefs> = {}): SyncRefs {
  return {
    "bm-1234": { issue: 10 },
    ...overrides,
  };
}
```

Then update existing test calls from `syncGitHub(manifest, config, resolved)` to `syncGitHub(epicInput, syncRefs, config, resolved)`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun --bun vitest run src/__tests__/github-sync.test.ts`
Expected: FAIL — old API doesn't match new signature

- [ ] **Step 3: Rewrite syncGitHub in sync.ts**

Key changes to `cli/src/github/sync.ts`:

1. Add new input types:
```typescript
/** Store-derived epic input for sync — no PipelineManifest dependency. */
export interface EpicSyncInput {
  id: string;
  slug: string;
  name?: string;
  phase: Phase;
  summary?: { problem: string; solution: string };
  features: FeatureSyncInput[];
  artifacts?: Record<string, string[]>;
}

/** Store-derived feature input for sync. */
export interface FeatureSyncInput {
  id: string;
  slug: string;
  status: "pending" | "in-progress" | "completed" | "blocked" | "cancelled";
  description?: string;
  plan?: string;
}
```

2. Change `SyncMutation` to target sync refs:
```typescript
export type SyncMutation =
  | { type: "setEpic"; entityId: string; issue: number; repo: string }
  | { type: "setFeatureIssue"; entityId: string; issue: number }
  | { type: "setEpicBodyHash"; entityId: string; bodyHash: string }
  | { type: "setFeatureBodyHash"; entityId: string; bodyHash: string };
```

3. Change `syncGitHub()` signature:
```typescript
export async function syncGitHub(
  epic: EpicSyncInput,
  syncRefs: SyncRefs,
  config: BeastmodeConfig,
  resolved: ResolvedGitHub,
  opts: { logger?: Logger; projectRoot?: string } = {},
): Promise<SyncResult>
```

4. Inside `syncGitHub()`, replace `manifest.github?.epic` with `getSyncRef(syncRefs, epic.id)?.issue`, replace `manifest.slug` with `epic.slug`, etc.

5. Rewrite `syncGitHubForEpic()`:
```typescript
export async function syncGitHubForEpic(opts: {
  projectRoot: string;
  epicId: string;
  epicSlug: string;
  store: TaskStore;
  resolved?: ResolvedGitHub;
  logger?: Logger;
}): Promise<void>
```
Loads store entity + sync refs, calls syncGitHub, applies mutations to sync file via `saveSyncRefs()`.

6. Remove all imports from `manifest/pure.js` and `manifest/store.js`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun --bun vitest run src/__tests__/github-sync.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/github/sync.ts cli/src/__tests__/github-sync.test.ts
git commit -m "feat(github-sync-separation): rewrite syncGitHub to use store entities + sync refs"
```

---

### Task 3: Rewrite early-issues.ts

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/github/early-issues.ts`

Rewrite to read/write sync file instead of manifest. Remove imports from `manifest/pure.js` and `manifest/store.js`.

- [ ] **Step 1: Write the rewritten early-issues.ts**

Key changes:
1. Replace `import * as store from "../manifest/store.js"` and `import { setGitHubEpic, setFeatureGitHubIssue }` with sync-refs and store imports
2. `EarlyIssueOpts` accepts `store: TaskStore` and `epicId: string` instead of `epicSlug: string`
3. `ensureEpicStub()` reads epic from store, writes issue number to sync file
4. `ensureFeatureStubs()` reads features from store, writes issue numbers to sync file

```typescript
/**
 * Early Issue Creation — pre-dispatch stub issue creation.
 *
 * Creates minimal GitHub stub issues before the phase skill runs,
 * so issue numbers are available from the first commit.
 *
 * Reads pipeline state from the store, writes issue numbers to
 * github-sync.json (not to store entities).
 */

import type { Phase } from "../types.js";
import type { BeastmodeConfig } from "../config.js";
import type { ResolvedGitHub } from "./discovery.js";
import type { Logger } from "../logger.js";
import type { TaskStore } from "../store/types.js";
import { discoverGitHub } from "./discovery.js";
import { ghIssueCreate } from "./cli.js";
import { loadSyncRefs, saveSyncRefs, getSyncRef, setSyncRef } from "./sync-refs.js";

/** Options for the pre-dispatch early issue creation step. */
export interface EarlyIssueOpts {
  phase: Phase;
  epicId: string;
  projectRoot: string;
  config: BeastmodeConfig;
  store: TaskStore;
  resolved?: ResolvedGitHub;
  logger?: Logger;
}

/**
 * Ensure GitHub stub issues exist before dispatch.
 *
 * - Design phase: creates epic stub issue.
 * - Implement phase: creates feature stub issues.
 * - Other phases: no-op.
 *
 * Idempotent — skips creation if sync file already has the issue number.
 * Never throws — all errors are caught and logged as warnings.
 */
export async function ensureEarlyIssues(opts: EarlyIssueOpts): Promise<void> {
  const { phase, epicId, projectRoot, config, store, logger } = opts;

  if (!config.github.enabled) return;
  if (phase !== "design" && phase !== "implement") return;

  try {
    const resolved = opts.resolved ?? await discoverGitHub(projectRoot, config.github["project-name"]);
    if (!resolved) {
      logger?.warn("early issues: GitHub discovery failed — skipping");
      return;
    }
    const repo = resolved.repo;

    const epic = store.getEpic(epicId);
    if (!epic) {
      logger?.debug("early issues: no epic in store — skipping");
      return;
    }

    let refs = loadSyncRefs(projectRoot);

    if (phase === "design") {
      const epicRef = getSyncRef(refs, epicId);
      if (epicRef?.issue) {
        logger?.debug("early issues: epic already has issue number — skipping");
        return;
      }

      const stubBody = `**Phase:** design\n\n_Stub issue — content will be enriched after the design phase completes._`;
      const epicNumber = await ghIssueCreate(
        repo,
        epic.slug,
        stubBody,
        ["type/epic", "phase/design"],
        { logger },
      );

      if (!epicNumber) {
        logger?.warn("early issues: epic stub creation failed — sync will retry at post-dispatch");
        return;
      }

      refs = setSyncRef(refs, epicId, { issue: epicNumber });
      saveSyncRefs(projectRoot, refs);
      logger?.info("early issues: epic stub created", { issue: epicNumber });
    } else if (phase === "implement") {
      const epicRef = getSyncRef(refs, epicId);
      if (!epicRef?.issue) {
        logger?.debug("early issues: no epic issue — skipping feature stubs");
        return;
      }

      const epicNumber = epicRef.issue;
      const features = store.listFeatures(epicId);
      const featuresToCreate = features.filter((f) => !getSyncRef(refs, f.id)?.issue);

      if (featuresToCreate.length === 0) {
        logger?.debug("early issues: all features already have issue numbers");
        return;
      }

      for (const feature of featuresToCreate) {
        const stubBody = `**Epic:** #${epicNumber}\n\n_Stub issue — content will be enriched after the implement phase completes._`;
        const issueNumber = await ghIssueCreate(
          repo,
          feature.slug,
          stubBody,
          ["type/feature", "status/ready"],
          { logger },
        );

        if (issueNumber) {
          refs = setSyncRef(refs, feature.id, { issue: issueNumber });
          logger?.info("early issues: feature stub created", { feature: feature.slug, issue: issueNumber });
        } else {
          logger?.warn(`early issues: feature stub creation failed for ${feature.slug} — sync will retry at post-dispatch`);
        }
      }

      saveSyncRefs(projectRoot, refs);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger?.warn(`early issues failed (non-blocking): ${message}`);
  }
}
```

- [ ] **Step 2: Run full test suite to verify nothing breaks**

Run: `cd cli && bun --bun vitest run`
Expected: PASS (early-issues.ts callers need updating in runner.ts — covered in Task 5)

- [ ] **Step 3: Commit**

```bash
git add cli/src/github/early-issues.ts
git commit -m "feat(github-sync-separation): rewrite early-issues to use store + sync refs"
```

---

### Task 4: Rewrite commit-issue-ref.ts

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/git/commit-issue-ref.ts`
- Modify: `cli/src/__tests__/commit-issue-ref.test.ts` (if exists)

Rewrite to read issue numbers from sync refs instead of manifest.

- [ ] **Step 1: Rewrite commit-issue-ref.ts**

Key changes:
1. Replace `import type { PipelineManifest } from "../manifest/store.js"` with sync-refs + store types
2. `resolveIssueNumber()` accepts `(branchName, syncRefs, epicId, features)` instead of `(branchName, manifest)`
3. `resolveCommitIssueNumber()` accepts `(commitMessage, syncRefs, epicId, features)` instead of `(commitMessage, manifest)`
4. `amendCommitsInRange()` accepts sync refs instead of manifest
5. `amendCommitWithIssueRef()` accepts sync refs instead of manifest

The routing logic stays identical — only the data source changes.

```typescript
/**
 * Commit issue reference — amends commit messages to append
 * a GitHub issue reference (#N).
 *
 * Reads issue numbers from github-sync.json (sync refs),
 * reads epic/feature identity from store entities.
 */

import { git } from "./worktree.js";
import { tagName } from "./tags.js";
import type { SyncRefs } from "../github/sync-refs.js";
import { getSyncRef } from "../github/sync-refs.js";

/** Result of parsing an impl branch name. */
export interface ImplBranchParts {
  slug: string;
  feature: string;
}

/** Minimal feature info needed for issue resolution. */
export interface IssueRefFeature {
  id: string;
  slug: string;
}

/**
 * Parse an impl branch name into slug and feature parts.
 */
export function parseImplBranch(branchName: string): ImplBranchParts | undefined {
  const match = branchName.match(/^impl\/(.+?)--(.+)$/);
  if (!match) return undefined;
  return { slug: match[1], feature: match[2] };
}

/**
 * Resolve the issue number for the current branch from sync refs.
 *
 * - impl/<slug>--<feature> → feature issue number
 * - feature/<slug> → epic issue number
 * - main/master → epic issue number
 */
export function resolveIssueNumber(
  branchName: string,
  syncRefs: SyncRefs,
  epicId: string,
  features: IssueRefFeature[],
): number | undefined {
  const implParts = parseImplBranch(branchName);
  if (implParts) {
    const feature = features.find((f) => f.slug === implParts.feature);
    if (feature) return getSyncRef(syncRefs, feature.id)?.issue;
    return getSyncRef(syncRefs, epicId)?.issue;
  }

  if (branchName.startsWith("feature/")) {
    return getSyncRef(syncRefs, epicId)?.issue;
  }

  if (branchName === "main" || branchName === "master") {
    return getSyncRef(syncRefs, epicId)?.issue;
  }

  return undefined;
}

/**
 * Append an issue reference to a commit message subject line.
 */
export function appendIssueRef(message: string, issueNumber: number): string {
  const lines = message.split("\n");
  const subject = lines[0];
  if (/\(#\d+\)$/.test(subject.trim())) {
    return message;
  }
  lines[0] = `${subject} (#${issueNumber})`;
  return lines.join("\n");
}

const PHASE_ORDER = ["design", "plan", "implement", "validate", "release"] as const;

/**
 * Resolve the issue number for a specific commit based on its message.
 */
export function resolveCommitIssueNumber(
  commitMessage: string,
  syncRefs: SyncRefs,
  epicId: string,
  features: IssueRefFeature[],
): number | undefined {
  const epicIssue = getSyncRef(syncRefs, epicId)?.issue;
  if (!epicIssue) return undefined;

  const featMatch = commitMessage.match(/^feat\(([^)]+)\):/);
  if (featMatch) {
    const featureSlug = featMatch[1];
    const feature = features.find((f) => f.slug === featureSlug);
    if (feature) {
      const featureIssue = getSyncRef(syncRefs, feature.id)?.issue;
      if (featureIssue) return featureIssue;
    }
    return epicIssue;
  }

  const implMatch = commitMessage.match(/^implement\([^)]*--([^)]+)\):/);
  if (implMatch) {
    const featureSlug = implMatch[1];
    const feature = features.find((f) => f.slug === featureSlug);
    if (feature) {
      const featureIssue = getSyncRef(syncRefs, feature.id)?.issue;
      if (featureIssue) return featureIssue;
    }
    return epicIssue;
  }

  return epicIssue;
}

// resolveRangeStart stays unchanged (no manifest dependency)

export async function resolveRangeStart(
  slug: string,
  currentPhase: string,
  opts: { cwd?: string } = {},
): Promise<string | undefined> {
  const phaseIdx = PHASE_ORDER.indexOf(currentPhase as (typeof PHASE_ORDER)[number]);

  if (phaseIdx > 0) {
    const prevPhase = PHASE_ORDER[phaseIdx - 1];
    const prevTag = tagName(slug, prevPhase);
    const result = await git(["rev-parse", prevTag], { cwd: opts.cwd, allowFailure: true });
    if (result.exitCode === 0 && result.stdout) {
      return result.stdout;
    }
  }

  const mbResult = await git(["merge-base", "main", "HEAD"], { cwd: opts.cwd, allowFailure: true });
  if (mbResult.exitCode === 0 && mbResult.stdout) {
    return mbResult.stdout;
  }

  return undefined;
}

export interface AmendRangeResult {
  amended: number;
  skipped: number;
}

/**
 * Amend all commits in a range to append issue references.
 */
export async function amendCommitsInRange(
  syncRefs: SyncRefs,
  epicId: string,
  features: IssueRefFeature[],
  slug: string,
  currentPhase: string,
  opts: { cwd?: string; rangeStartOverride?: string } = {},
): Promise<AmendRangeResult> {
  const epicIssue = getSyncRef(syncRefs, epicId)?.issue;
  if (!epicIssue) {
    return { amended: 0, skipped: 0 };
  }

  let rangeStart: string | undefined;
  if (opts.rangeStartOverride) {
    const r = await git(["rev-parse", opts.rangeStartOverride], { cwd: opts.cwd, allowFailure: true });
    rangeStart = r.exitCode === 0 ? r.stdout : undefined;
  } else {
    rangeStart = await resolveRangeStart(slug, currentPhase, opts);
  }

  if (!rangeStart) {
    return { amended: 0, skipped: 0 };
  }

  const logResult = await git(
    ["log", "--reverse", "--format=%H|%s", `${rangeStart}..HEAD`],
    { cwd: opts.cwd, allowFailure: true },
  );

  if (logResult.exitCode !== 0 || !logResult.stdout) {
    return { amended: 0, skipped: 0 };
  }

  const commits = logResult.stdout.split("\n").filter(Boolean).map((line) => {
    const idx = line.indexOf("|");
    return { sha: line.slice(0, idx), subject: line.slice(idx + 1) };
  });

  if (commits.length === 0) {
    return { amended: 0, skipped: 0 };
  }

  const amendments = new Map<string, string>();
  let skipped = 0;

  for (const commit of commits) {
    if (/\(#\d+\)$/.test(commit.subject.trim())) {
      skipped++;
      continue;
    }
    const issueNumber = resolveCommitIssueNumber(commit.subject, syncRefs, epicId, features);
    if (issueNumber) {
      amendments.set(commit.subject, `${commit.subject} (#${issueNumber})`);
    } else {
      skipped++;
    }
  }

  if (amendments.size === 0) {
    return { amended: 0, skipped };
  }

  const { writeFile, unlink } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const cwd = opts.cwd ?? process.cwd();
  const mapPath = join(cwd, ".git", "beastmode-amend-map.txt");

  const mapLines: string[] = [];
  for (const [oldSubject, newMessage] of amendments) {
    mapLines.push(`${oldSubject}\t${newMessage}`);
  }
  await writeFile(mapPath, mapLines.join("\n") + "\n");

  const scriptPath = join(cwd, ".git", "beastmode-amend.sh");
  const escapedMapPath = mapPath.replace(/'/g, "'\\''");
  const script = `#!/bin/sh
SUBJECT=$(git log -1 --format=%s)
MAP_FILE='${escapedMapPath}'
NEW_MSG=""
while IFS=$(printf '\\t') read -r old new; do
  if [ "$old" = "$SUBJECT" ]; then
    NEW_MSG="$new"
    break
  fi
done < "$MAP_FILE"
if [ -n "$NEW_MSG" ]; then
  git commit --amend -m "$NEW_MSG"
fi
`;
  await writeFile(scriptPath, script, { mode: 0o755 });

  const rebaseResult = await git(
    ["rebase", "--exec", `sh '${scriptPath.replace(/'/g, "'\\''")}'`, rangeStart],
    { cwd: opts.cwd, allowFailure: true },
  );

  await unlink(mapPath).catch(() => {});
  await unlink(scriptPath).catch(() => {});

  if (rebaseResult.exitCode !== 0) {
    await git(["rebase", "--abort"], { cwd: opts.cwd, allowFailure: true });
    return { amended: 0, skipped };
  }

  return { amended: amendments.size, skipped };
}

/**
 * Amend the most recent commit to append an issue reference.
 */
export async function amendCommitWithIssueRef(
  syncRefs: SyncRefs,
  epicId: string,
  features: IssueRefFeature[],
  opts: { cwd?: string } = {},
): Promise<{ amended: boolean; issueNumber?: number }> {
  const branchResult = await git(
    ["rev-parse", "--abbrev-ref", "HEAD"],
    { cwd: opts.cwd, allowFailure: true },
  );
  if (branchResult.exitCode !== 0) {
    return { amended: false };
  }
  const branchName = branchResult.stdout;

  const issueNumber = resolveIssueNumber(branchName, syncRefs, epicId, features);
  if (!issueNumber) {
    return { amended: false };
  }

  const msgResult = await git(
    ["log", "-1", "--format=%B"],
    { cwd: opts.cwd, allowFailure: true },
  );
  if (msgResult.exitCode !== 0) {
    return { amended: false };
  }
  const currentMessage = msgResult.stdout;

  const newMessage = appendIssueRef(currentMessage, issueNumber);
  if (newMessage === currentMessage) {
    return { amended: false };
  }

  await git(
    ["commit", "--amend", "-m", newMessage],
    { cwd: opts.cwd },
  );

  return { amended: true, issueNumber };
}
```

- [ ] **Step 2: Update tests if they exist**

Check `cli/src/__tests__/commit-issue-ref.test.ts` and update to use new signature with sync refs.

- [ ] **Step 3: Run tests**

Run: `cd cli && bun --bun vitest run`
Expected: PASS (or known failures in runner.ts which is updated in Task 5)

- [ ] **Step 4: Commit**

```bash
git add cli/src/git/commit-issue-ref.ts
git commit -m "feat(github-sync-separation): rewrite commit-issue-ref to use sync refs"
```

---

### Task 5: Rewrite Runner Step 8 + Step 8.5 + Step 8.9

**Wave:** 3
**Depends on:** Task 2, Task 3, Task 4

**Files:**
- Modify: `cli/src/pipeline/runner.ts`

Rewrite step 8 (GitHub mirror), step 8.5 (commit-issue-ref), and step 8.9 (branch-link) to use store + sync refs.

- [ ] **Step 1: Rewrite runner.ts steps**

Key changes:

**Step 8 (GitHub mirror):**
- Watch loop path: call `syncGitHubForEpic()` with new signature (epicId, store)
- Manual CLI path: load store entity + sync refs, call `syncGitHub()`, apply mutations to sync file via `saveSyncRefs()`
- Remove `setGitHubEpic`, `setFeatureGitHubIssue`, `setEpicBodyHash`, `setFeatureBodyHash` imports from `manifest/pure.js`
- Remove mutation application loop that called those pure functions

**Step 8.5 (commit-issue-ref):**
- Load sync refs + store features instead of manifest
- Call `amendCommitsInRange()` with new signature

**Step 8.9 (branch-link):**
- Read epic issue number from sync refs instead of `manifest.github.epic`
- Read feature issue number from sync refs instead of `manifest.features[].github?.issue`

**Early issues call (Step 3.5):**
- Update `ensureEarlyIssues()` call to pass store + epicId

- [ ] **Step 2: Run full test suite**

Run: `cd cli && bun --bun vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/pipeline/runner.ts
git commit -m "feat(github-sync-separation): rewrite runner steps 8/8.5/8.9 to use store + sync refs"
```

---

### Task 6: Update Tests and Final Verification

**Wave:** 4
**Depends on:** Task 5

**Files:**
- Modify: `cli/src/__tests__/github-sync.test.ts`
- Modify: `cli/src/__tests__/sync-helper.test.ts` (if affected)
- Create: `cli/src/__tests__/github-sync-separation.integration.test.ts` (already created in Task 0 — verify GREEN)

- [ ] **Step 1: Verify all test files compile and pass**

Run: `cd cli && bun --bun vitest run`
Expected: PASS

- [ ] **Step 2: Run integration test (GREEN)**

Run: `cd cli && bun --bun vitest run src/__tests__/github-sync-separation.integration.test.ts`
Expected: PASS — all 5 scenarios green

- [ ] **Step 3: Run typecheck**

Run: `cd cli && bun x tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Verify no GitHub fields on store Entity types**

Verify `cli/src/store/types.ts` has no `github` field on `Epic` or `Feature` types (it shouldn't — the types were never modified to have them).

- [ ] **Step 5: Verify pure.ts functions are no longer imported**

Run: `grep -r "setGitHubEpic\|setFeatureGitHubIssue\|setEpicBodyHash\|setFeatureBodyHash" cli/src/ --include="*.ts" | grep -v "manifest/pure.ts" | grep -v "__tests__/manifest-pure" | grep -v ".test.ts"`
Expected: No matches outside of manifest/pure.ts itself and its own test

- [ ] **Step 6: Commit**

```bash
git add cli/src/__tests__/
git commit -m "feat(github-sync-separation): update tests, verify integration"
```
