# Validate Feedback Loop

## Goal

Make the validate phase identify which specific features failed integration tests and re-dispatch only those features for a full re-implement cycle (max 2 per feature), instead of blanket-resetting all features.

## Architecture

The current system sends a generic `REGRESS` event when validate fails, which resets ALL features to "pending" via the `regress()` pure function. The new behavior requires:

1. **Validate artifact carries per-feature pass/fail** — the validate skill writes which features passed and which failed into the frontmatter
2. **Generate-output parses failing features** — the stop hook extracts `failedFeatures` into the output.json
3. **New REGRESS_FEATURES event** — targets specific features for reset instead of blanket reset
4. **reconcileValidate uses targeted reset** — reads failing features from output, sends targeted event
5. **Re-dispatch budget tracking** — manifest tracks per-feature re-dispatch count, max 2

## Tech Stack

- TypeScript (Bun runtime)
- XState v5 state machine (setup() API)
- Cucumber.js for integration tests
- Vitest for unit tests

## Design Decisions (from PRD)

- Outer retry budget: 2 full re-implement cycles per feature at validate
- Each re-dispatch resets inner retry counter to 0, model tier to haiku
- Validate re-runs for entire epic after re-implementation
- Features exceeding 2 re-dispatch budget are marked permanently failed
- Passing features retain completed status — no blanket reset
- Test-to-feature mapping: convention-based (tags, naming, describe blocks)

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/pipeline-machine/types.ts` | Modify | Add `REGRESS_FEATURES` event type with `failingFeatures` payload |
| `cli/src/pipeline-machine/epic.ts` | Modify | Add `REGRESS_FEATURES` handler in validate state |
| `cli/src/pipeline-machine/guards.ts` | Modify | Add `hasFailingFeatures` guard |
| `cli/src/pipeline-machine/actions.ts` | Modify | Add `computeRegressFeatures` action |
| `cli/src/manifest/pure.ts` | Modify | Add `regressFeatures()` pure function for targeted feature reset |
| `cli/src/manifest/store.ts` | Modify | Add `reDispatchCount` field to `ManifestFeature` type |
| `cli/src/manifest/reconcile.ts` | Modify | Update `reconcileValidate` to use targeted reset |
| `cli/src/hooks/generate-output.ts` | Modify | Parse `failedFeatures` from validate frontmatter |
| `cli/src/types.ts` | Modify | Add `failedFeatures` to `ValidateArtifacts` |
| `cli/features/regression-loop.feature` | Modify | Update to assert targeted re-dispatch |
| `cli/features/pipeline-error-resilience.feature` | Modify | Update scenario 3 for targeted re-dispatch |
| `cli/features/validate-feedback-loop.feature` | Create | New Cucumber feature for validate re-dispatch |
| `cli/features/step_definitions/validate-feedback.steps.ts` | Create | Step definitions for validate feedback |
| `cli/features/support/world.ts` | Modify | Add `writeValidateArtifactWithFailures` helper |
| `cli/cucumber.json` | Modify | Add `validate-feedback` profile |
| `cli/src/__tests__/manifest-pure.test.ts` | Modify | Add tests for `regressFeatures()` |
| `cli/src/pipeline-machine/__tests__/epic.test.ts` | Modify | Add tests for `REGRESS_FEATURES` event |
| `skills/validate/SKILL.md` | Modify | Add re-dispatch loop behavior |

---

### Task 0: Integration Test — Validate Feedback Loop Feature File

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/features/validate-feedback-loop.feature`
- Create: `cli/features/step_definitions/validate-feedback.steps.ts`
- Modify: `cli/features/support/world.ts`
- Modify: `cli/cucumber.json`

- [ ] **Step 1: Write the Cucumber feature file**

```gherkin
# cli/features/validate-feedback-loop.feature
Feature: Validate re-dispatches only failing features for re-implement cycles

  When validation identifies failing features, the validate phase
  re-dispatches only those specific features for a complete
  re-implementation cycle (not a full epic regression). Each feature
  gets a maximum of two re-implement cycles. Passing features
  retain their completed status.

  Scenario: Validate identifies and re-dispatches only the failing feature

    # -- Phase 1: Design --
    Given the initial epic slug is "hex0c3d4e"
    And a manifest is seeded for slug "hex0c3d4e"

    When the dispatch will write a design artifact:
      | field    | value                          |
      | phase    | design                         |
      | slug     | hex0c3d4e                      |
      | epic     | auth-flow                      |
      | problem  | Cross-feature integration      |
      | solution | Targeted re-dispatch           |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the manifest slug should be "auth-flow"
    And the manifest phase should be "plan"

    # -- Phase 2: Plan with two features --
    When the dispatch will write plan artifacts:
      | feature        | wave | description              |
      | auth-provider  | 1    | OAuth2 provider setup    |
      | token-cache    | 1    | Token caching layer      |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And the manifest should have 2 features

    # -- Phase 3: Implement both features --
    When the dispatch will write an implement artifact for feature "auth-provider"
    And the pipeline runs the "implement" phase for feature "auth-provider"
    Then the pipeline result should be successful
    And feature "auth-provider" should have status "completed"

    When the dispatch will write an implement artifact for feature "token-cache"
    And the pipeline runs the "implement" phase for feature "token-cache"
    Then the pipeline result should be successful
    And feature "token-cache" should have status "completed"
    And the manifest phase should be "validate"

    # -- Phase 4a: Validate with token-cache failing --
    When the dispatch will write a validate artifact with failures:
      | feature       | result |
      | auth-provider | passed |
      | token-cache   | failed |
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And feature "auth-provider" should have status "completed"
    And feature "token-cache" should have status "pending"

    # -- Phase 3b: Re-implement only token-cache --
    When the dispatch will write an implement artifact for feature "token-cache"
    And the pipeline runs the "implement" phase for feature "token-cache"
    Then the pipeline result should be successful
    And feature "token-cache" should have status "completed"
    And the manifest phase should be "validate"

    # -- Phase 4b: Re-validate — all pass --
    When the dispatch will write a validate artifact with status "passed"
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "release"


  Scenario: Maximum of two re-dispatch cycles per feature

    # -- Phase 1: Design --
    Given the initial epic slug is "hex1a2b3c"
    And a manifest is seeded for slug "hex1a2b3c"

    When the dispatch will write a design artifact:
      | field    | value                     |
      | phase    | design                    |
      | slug     | hex1a2b3c                 |
      | epic     | stubborn-epic             |
      | problem  | Persistent failure        |
      | solution | Budget exhaustion         |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the manifest slug should be "stubborn-epic"

    # -- Phase 2: Plan --
    When the dispatch will write plan artifacts:
      | feature    | wave | description       |
      | flaky-feat | 1    | Unreliable feature |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful

    # -- Phase 3a: Implement --
    When the dispatch will write an implement artifact for feature "flaky-feat"
    And the pipeline runs the "implement" phase for feature "flaky-feat"
    Then the pipeline result should be successful

    # -- Phase 4a: Validate fail #1 --
    When the dispatch will write a validate artifact with failures:
      | feature    | result |
      | flaky-feat | failed |
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And feature "flaky-feat" should have reDispatchCount 1

    # -- Phase 3b: Re-implement #1 --
    When the dispatch will write an implement artifact for feature "flaky-feat"
    And the pipeline runs the "implement" phase for feature "flaky-feat"
    Then the pipeline result should be successful

    # -- Phase 4b: Validate fail #2 --
    When the dispatch will write a validate artifact with failures:
      | feature    | result |
      | flaky-feat | failed |
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And feature "flaky-feat" should have reDispatchCount 2

    # -- Phase 3c: Re-implement #2 --
    When the dispatch will write an implement artifact for feature "flaky-feat"
    And the pipeline runs the "implement" phase for feature "flaky-feat"
    Then the pipeline result should be successful

    # -- Phase 4c: Validate fail #3 — budget exhausted --
    When the dispatch will write a validate artifact with failures:
      | feature    | result |
      | flaky-feat | failed |
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And feature "flaky-feat" should have status "blocked"
```

- [ ] **Step 2: Write step definitions for validate feedback**

```typescript
// cli/features/step_definitions/validate-feedback.steps.ts
/**
 * Step definitions for validate feedback loop integration test.
 *
 * Adds targeted validate failure steps and assertions.
 * Reuses pipeline steps from pipeline.steps.ts.
 */

import { When, Then, DataTable } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import * as store from "../../src/manifest/store.js";
import type { PipelineWorld } from "../support/world.js";

// -- When: validate with per-feature failures --

When(
  "the dispatch will write a validate artifact with failures:",
  function (this: PipelineWorld, table: DataTable) {
    const results = table.hashes().map((row) => ({
      feature: row.feature,
      result: row.result,
    }));
    this.pendingWriter = (cwd: string) => {
      this.writeValidateArtifactWithFailures(cwd, this.epicSlug, results);
    };
  },
);

// -- Then: reDispatchCount assertions --

Then(
  "feature {string} should have reDispatchCount {int}",
  function (this: PipelineWorld, featureSlug: string, expectedCount: number) {
    const manifest = store.load(this.projectRoot, this.epicSlug);
    assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
    const feature = manifest.features.find((f) => f.slug === featureSlug);
    assert.ok(feature, `Feature "${featureSlug}" not found in manifest`);
    assert.strictEqual(
      feature.reDispatchCount ?? 0,
      expectedCount,
      `Feature "${featureSlug}" has reDispatchCount ${feature.reDispatchCount ?? 0}, expected ${expectedCount}`,
    );
  },
);
```

- [ ] **Step 3: Add writeValidateArtifactWithFailures to PipelineWorld**

In `cli/features/support/world.ts`, add after the existing `writeValidateArtifact` method:

```typescript
writeValidateArtifactWithFailures(
  wtPath: string,
  epicSlug: string,
  results: Array<{ feature: string; result: string }>,
): void {
  const date = new Date().toISOString().slice(0, 10);
  const dir = join(wtPath, ".beastmode", "artifacts", "validate");
  mkdirSync(dir, { recursive: true });

  const failedFeatures = results
    .filter((r) => r.result === "failed")
    .map((r) => r.feature);

  const allPassed = failedFeatures.length === 0;

  const frontmatter = [
    `phase: validate`,
    `slug: ${epicSlug}`,
    `epic: ${epicSlug}`,
    `status: ${allPassed ? "passed" : "failed"}`,
    ...(failedFeatures.length > 0
      ? [`failedFeatures: ${failedFeatures.join(",")}`]
      : []),
  ].join("\n");

  writeFileSync(
    join(dir, `${date}-${epicSlug}.md`),
    `---\n${frontmatter}\n---\n\n# Validation Report\n\n## Results\n${results.map((r) => `- ${r.feature}: ${r.result}`).join("\n")}\n`,
  );
}
```

- [ ] **Step 4: Add validate-feedback profile to cucumber.json**

Add new entry to `cli/cucumber.json`:

```json
"validate-feedback": {
  "paths": ["features/validate-feedback-loop.feature"],
  "import": [
    "features/step_definitions/pipeline.steps.ts",
    "features/step_definitions/validate-feedback.steps.ts",
    "features/support/world.ts",
    "features/support/hooks.ts"
  ],
  "format": ["progress-bar"],
  "publishQuiet": true
}
```

Also add the new feature file and step definitions to the `pipeline-all` profile paths and imports.

- [ ] **Step 5: Run test to verify it fails**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile validate-feedback 2>&1 | tail -30`
Expected: FAIL — steps are undefined or types don't exist yet

- [ ] **Step 6: Commit**

```bash
git add cli/features/validate-feedback-loop.feature cli/features/step_definitions/validate-feedback.steps.ts cli/features/support/world.ts cli/cucumber.json
git commit -m "feat(validate-feedback-loop): add integration test feature file and step definitions"
```

---

### Task 1: ManifestFeature reDispatchCount and Pure Function

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/manifest/store.ts:37-44`
- Modify: `cli/src/manifest/pure.ts`
- Modify: `cli/src/__tests__/manifest-pure.test.ts`

- [ ] **Step 1: Write failing test for regressFeatures pure function**

In `cli/src/__tests__/manifest-pure.test.ts`, add a new describe block:

```typescript
describe("regressFeatures", () => {
  it("resets only failing features to pending", () => {
    const manifest: PipelineManifest = {
      slug: "test-epic",
      phase: "validate",
      features: [
        { slug: "feat-a", plan: "", status: "completed" },
        { slug: "feat-b", plan: "", status: "completed" },
        { slug: "feat-c", plan: "", status: "completed" },
      ],
      artifacts: {},
      lastUpdated: "2026-04-05T00:00:00.000Z",
    };

    const result = regressFeatures(manifest, ["feat-b"]);
    expect(result.phase).toBe("implement");
    expect(result.features[0]).toMatchObject({ slug: "feat-a", status: "completed" });
    expect(result.features[1]).toMatchObject({ slug: "feat-b", status: "pending", reDispatchCount: 1 });
    expect(result.features[2]).toMatchObject({ slug: "feat-c", status: "completed" });
  });

  it("increments reDispatchCount on repeated regression", () => {
    const manifest: PipelineManifest = {
      slug: "test-epic",
      phase: "validate",
      features: [
        { slug: "feat-a", plan: "", status: "completed", reDispatchCount: 1 },
      ],
      artifacts: {},
      lastUpdated: "2026-04-05T00:00:00.000Z",
    };

    const result = regressFeatures(manifest, ["feat-a"]);
    expect(result.features[0]).toMatchObject({ slug: "feat-a", status: "pending", reDispatchCount: 2 });
  });

  it("marks feature as blocked when reDispatchCount exceeds 2", () => {
    const manifest: PipelineManifest = {
      slug: "test-epic",
      phase: "validate",
      features: [
        { slug: "feat-a", plan: "", status: "completed", reDispatchCount: 2 },
      ],
      artifacts: {},
      lastUpdated: "2026-04-05T00:00:00.000Z",
    };

    const result = regressFeatures(manifest, ["feat-a"]);
    expect(result.features[0]).toMatchObject({ slug: "feat-a", status: "blocked", reDispatchCount: 3 });
  });

  it("returns original features when failingFeatures is empty", () => {
    const manifest: PipelineManifest = {
      slug: "test-epic",
      phase: "validate",
      features: [
        { slug: "feat-a", plan: "", status: "completed" },
      ],
      artifacts: {},
      lastUpdated: "2026-04-05T00:00:00.000Z",
    };

    const result = regressFeatures(manifest, []);
    expect(result.features[0]).toMatchObject({ slug: "feat-a", status: "completed" });
    expect(result.phase).toBe("validate");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cli && bun --bun vitest run src/__tests__/manifest-pure.test.ts 2>&1 | tail -20`
Expected: FAIL — `regressFeatures` is not exported from pure.ts

- [ ] **Step 3: Add reDispatchCount to ManifestFeature type**

In `cli/src/manifest/store.ts`, modify the `ManifestFeature` interface:

```typescript
export interface ManifestFeature {
  slug: string;
  plan: string;
  description?: string;
  wave?: number;
  status: "pending" | "in-progress" | "completed" | "blocked";
  reDispatchCount?: number;
  github?: { issue: number; bodyHash?: string };
}
```

- [ ] **Step 4: Implement regressFeatures pure function**

In `cli/src/manifest/pure.ts`, add after the existing `regress` function:

```typescript
/**
 * Regress specific features to pending status for targeted re-dispatch.
 * Increments reDispatchCount for each failing feature.
 * Features exceeding MAX_REDISPATCH (2) are marked as blocked.
 * Passing features retain their completed status.
 * Returns manifest at "implement" phase if any features were reset.
 */
const MAX_REDISPATCH = 2;

export function regressFeatures(
  manifest: PipelineManifest,
  failingFeatures: string[],
): PipelineManifest {
  if (failingFeatures.length === 0) return manifest;

  const failingSet = new Set(failingFeatures);

  const features = manifest.features.map((f) => {
    if (!failingSet.has(f.slug)) return f;

    const count = (f.reDispatchCount ?? 0) + 1;
    if (count > MAX_REDISPATCH) {
      return { ...f, status: "blocked" as const, reDispatchCount: count };
    }
    return { ...f, status: "pending" as const, reDispatchCount: count };
  });

  // Clear downstream artifacts (validate, release)
  const validateIdx = PHASE_ORDER.indexOf("validate");
  const artifacts: Record<string, string[]> = {};
  for (const [phase, files] of Object.entries(manifest.artifacts)) {
    const phaseIdx = PHASE_ORDER.indexOf(phase as Phase);
    if (phaseIdx !== -1 && phaseIdx >= validateIdx) continue;
    artifacts[phase] = files;
  }

  return {
    ...manifest,
    phase: "implement" as Phase,
    features,
    artifacts,
    lastUpdated: now(),
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/__tests__/manifest-pure.test.ts 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add cli/src/manifest/store.ts cli/src/manifest/pure.ts cli/src/__tests__/manifest-pure.test.ts
git commit -m "feat(validate-feedback-loop): add regressFeatures pure function and reDispatchCount field"
```

---

### Task 2: XState Machine — REGRESS_FEATURES Event

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/pipeline-machine/types.ts:17-25`
- Modify: `cli/src/pipeline-machine/guards.ts`
- Modify: `cli/src/pipeline-machine/actions.ts`
- Modify: `cli/src/pipeline-machine/epic.ts`
- Modify: `cli/src/pipeline-machine/__tests__/epic.test.ts`

- [ ] **Step 1: Write failing test for REGRESS_FEATURES event**

In `cli/src/pipeline-machine/__tests__/epic.test.ts`, add:

```typescript
describe("REGRESS_FEATURES event", () => {
  it("transitions validate -> implement when failingFeatures has entries", () => {
    const context: EpicContext = {
      slug: "test-epic",
      phase: "validate",
      features: [
        { slug: "feat-a", plan: "", status: "completed" },
        { slug: "feat-b", plan: "", status: "completed" },
      ],
      artifacts: {},
      lastUpdated: "2026-04-05T00:00:00.000Z",
    };

    const actor = createActor(epicMachine, {
      snapshot: epicMachine.resolveState({ value: "validate", context }),
      input: context,
    });
    actor.start();
    actor.send({ type: "REGRESS_FEATURES", failingFeatures: ["feat-b"] });

    const snap = actor.getSnapshot();
    expect(snap.value).toBe("implement");
    expect(snap.context.features[0]).toMatchObject({ slug: "feat-a", status: "completed" });
    expect(snap.context.features[1]).toMatchObject({ slug: "feat-b", status: "pending", reDispatchCount: 1 });
    actor.stop();
  });

  it("stays in validate when failingFeatures is empty", () => {
    const context: EpicContext = {
      slug: "test-epic",
      phase: "validate",
      features: [
        { slug: "feat-a", plan: "", status: "completed" },
      ],
      artifacts: {},
      lastUpdated: "2026-04-05T00:00:00.000Z",
    };

    const actor = createActor(epicMachine, {
      snapshot: epicMachine.resolveState({ value: "validate", context }),
      input: context,
    });
    actor.start();
    actor.send({ type: "REGRESS_FEATURES", failingFeatures: [] });

    const snap = actor.getSnapshot();
    expect(snap.value).toBe("validate");
    actor.stop();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cli && bun --bun vitest run src/pipeline-machine/__tests__/epic.test.ts 2>&1 | tail -20`
Expected: FAIL — `REGRESS_FEATURES` event type doesn't exist

- [ ] **Step 3: Add REGRESS_FEATURES event type**

In `cli/src/pipeline-machine/types.ts`, add to the `EpicEvent` union:

```typescript
export type EpicEvent =
  | { type: "DESIGN_COMPLETED"; realSlug?: string; summary?: { problem: string; solution: string }; artifacts?: Record<string, string[]> }
  | { type: "PLAN_COMPLETED"; features: Array<{ slug: string; plan: string; description?: string; wave?: number }>; artifacts?: Record<string, string[]> }
  | { type: "FEATURE_COMPLETED"; featureSlug: string }
  | { type: "IMPLEMENT_COMPLETED" }
  | { type: "VALIDATE_COMPLETED" }
  | { type: "REGRESS"; targetPhase: Phase }
  | { type: "REGRESS_FEATURES"; failingFeatures: string[] }
  | { type: "RELEASE_COMPLETED" }
  | { type: "CANCEL" };
```

- [ ] **Step 4: Add hasFailingFeatures guard**

In `cli/src/pipeline-machine/guards.ts`, add:

```typescript
/** Guard: REGRESS_FEATURES is valid only if failingFeatures is non-empty. */
export const hasFailingFeatures = ({ event }: { context: EpicContext; event: EpicEvent }) => {
  if (event.type !== "REGRESS_FEATURES") return false;
  return Array.isArray(event.failingFeatures) && event.failingFeatures.length > 0;
};
```

- [ ] **Step 5: Add computeRegressFeatures action**

In `cli/src/pipeline-machine/actions.ts`, add:

```typescript
import { regress, regressFeatures } from "../manifest/pure";
```

(Update the import to also include `regressFeatures`.)

Then add:

```typescript
/**
 * Compute the targeted feature regression using regressFeatures() pure function.
 * Returns a partial EpicContext with all fields that need updating.
 */
export function computeRegressFeatures(context: EpicContext, event: EpicEvent): Partial<EpicContext> {
  if (event.type !== "REGRESS_FEATURES") return {};

  const manifest = {
    slug: context.slug,
    phase: context.phase,
    features: context.features,
    artifacts: context.artifacts,
    lastUpdated: context.lastUpdated,
  };
  const result = regressFeatures(manifest as any, event.failingFeatures);
  return {
    phase: result.phase,
    features: result.features,
    artifacts: result.artifacts,
  };
}
```

- [ ] **Step 6: Wire REGRESS_FEATURES into the epic machine**

In `cli/src/pipeline-machine/epic.ts`:

1. Add to guards import: `hasFailingFeatures`
2. Add to actions import: `computeRegressFeatures`
3. Add to `setup({ guards: { ... } })`: `hasFailingFeatures,`
4. Add to `setup({ actions: { ... } })`:

```typescript
applyRegressFeatures: assign(({ context, event }) => {
  const result = computeRegressFeatures(context, event);
  return {
    ...result,
    lastUpdated: new Date().toISOString(),
  };
}),
```

5. Add to the `validate` state `on:` block (BEFORE the existing REGRESS entries):

```typescript
REGRESS_FEATURES: {
  target: "implement",
  guard: "hasFailingFeatures",
  actions: ["applyRegressFeatures", "persist"],
},
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/pipeline-machine/__tests__/epic.test.ts 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add cli/src/pipeline-machine/types.ts cli/src/pipeline-machine/guards.ts cli/src/pipeline-machine/actions.ts cli/src/pipeline-machine/epic.ts cli/src/pipeline-machine/__tests__/epic.test.ts
git commit -m "feat(validate-feedback-loop): add REGRESS_FEATURES event to XState machine"
```

---

### Task 3: Generate-Output and Reconcile — Targeted Re-Dispatch

**Wave:** 3
**Depends on:** Task 2

**Files:**
- Modify: `cli/src/types.ts:35-38`
- Modify: `cli/src/hooks/generate-output.ts:106-112`
- Modify: `cli/src/manifest/reconcile.ts:198-217`

- [ ] **Step 1: Write failing unit test for generate-output failedFeatures**

In `cli/src/__tests__/generate-output.test.ts` (locate existing file or create), add:

```typescript
import { describe, it, expect } from "vitest";
import { buildOutput, parseFrontmatter } from "../hooks/generate-output.js";

describe("validate buildOutput with failedFeatures", () => {
  it("includes failedFeatures in artifacts when present", () => {
    const fm = parseFrontmatter(
      "---\nphase: validate\nslug: test\nepic: test\nstatus: failed\nfailedFeatures: token-cache,auth-lib\n---\n",
    );
    const output = buildOutput("test.md", fm, "/tmp");
    expect(output).toBeDefined();
    expect(output!.status).toBe("error");
    expect((output!.artifacts as any).failedFeatures).toEqual(["token-cache", "auth-lib"]);
  });

  it("does not include failedFeatures when absent", () => {
    const fm = parseFrontmatter(
      "---\nphase: validate\nslug: test\nepic: test\nstatus: passed\n---\n",
    );
    const output = buildOutput("test.md", fm, "/tmp");
    expect(output).toBeDefined();
    expect(output!.status).toBe("completed");
    expect((output!.artifacts as any).failedFeatures).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cli && bun --bun vitest run src/__tests__/generate-output.test.ts 2>&1 | tail -20`
Expected: FAIL — failedFeatures not in output

- [ ] **Step 3: Add failedFeatures to ValidateArtifacts type**

In `cli/src/types.ts`, update:

```typescript
export interface ValidateArtifacts {
  report: string;
  passed: boolean;
  failedFeatures?: string[];
}
```

- [ ] **Step 4: Add failedFeatures to ArtifactFrontmatter and buildOutput**

In `cli/src/hooks/generate-output.ts`:

1. Add to `ArtifactFrontmatter` interface:

```typescript
failedFeatures?: string;
```

2. Update the `case "validate":` block in `buildOutput`:

```typescript
case "validate": {
  const passed = fm.status !== "failed";
  const failedFeatures = fm.failedFeatures
    ? fm.failedFeatures.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;
  return {
    status: passed ? "completed" : "error",
    artifacts: {
      report: artifactPath,
      passed,
      ...(failedFeatures && failedFeatures.length > 0 ? { failedFeatures } : {}),
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/__tests__/generate-output.test.ts 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 6: Update reconcileValidate to use targeted reset**

In `cli/src/manifest/reconcile.ts`, update `reconcileValidate`:

```typescript
export async function reconcileValidate(
  projectRoot: string,
  slug: string,
  wtPath: string,
): Promise<ReconcileResult | undefined> {
  const output = loadWorktreePhaseOutput(wtPath, "validate", slug);

  const updated = await store.transact(projectRoot, slug, (m) => {
    const actor = hydrateActor(m);
    if (output?.status === "completed") {
      actor.send({ type: "VALIDATE_COMPLETED" });
    } else {
      // Check for per-feature failure info
      const artifacts = output?.artifacts as unknown as Record<string, unknown> | undefined;
      const failedFeatures = artifacts?.failedFeatures as string[] | undefined;
      if (failedFeatures && failedFeatures.length > 0) {
        actor.send({ type: "REGRESS_FEATURES", failingFeatures: failedFeatures });
      } else {
        // Fallback: blanket regression (no per-feature info)
        actor.send({ type: "REGRESS", targetPhase: "implement" as Phase });
      }
    }
    return extractManifest(actor);
  });

  return { manifest: updated, phase: updated.phase as Phase, progress: readProgress(updated) };
}
```

- [ ] **Step 7: Run unit tests to verify**

Run: `cd cli && bun --bun vitest run 2>&1 | tail -20`
Expected: PASS (all existing tests still pass)

- [ ] **Step 8: Commit**

```bash
git add cli/src/types.ts cli/src/hooks/generate-output.ts cli/src/manifest/reconcile.ts cli/src/__tests__/generate-output.test.ts
git commit -m "feat(validate-feedback-loop): wire failedFeatures through generate-output and reconcile"
```

---

### Task 4: Update Existing Feature Files

**Wave:** 3
**Depends on:** Task 2

**Files:**
- Modify: `cli/features/regression-loop.feature`
- Modify: `cli/features/pipeline-error-resilience.feature`
- Modify: `cli/features/step_definitions/regression.steps.ts`

- [ ] **Step 1: Update regression-loop.feature for targeted re-dispatch**

Replace the regression-loop.feature content. The key change is:
- After validate failure, only failing features reset to "pending" while passing features stay "completed"
- The feature now uses the new `write a validate artifact with failures:` step

The existing scenario asserts `And all features should have status "pending"` after validate failure. This must change to assert that only the specific failing feature resets.

Updated scenario (replace lines 64-70 of the existing file):

```gherkin
    # -- Phase 4a: Validate with FAILURE (token-cache fails) --
    When the dispatch will write a validate artifact with failures:
      | feature      | result |
      | oauth-server | passed |
      | client-lib   | passed |
      | token-cache  | failed |
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the pipeline result should indicate regression
    And the manifest phase should be "implement"
    And feature "oauth-server" should have status "completed"
    And feature "client-lib" should have status "completed"
    And feature "token-cache" should have status "pending"

    # -- Phase 3c: Re-implement only token-cache after regression --
    When the dispatch will write an implement artifact for feature "token-cache"
    And the pipeline runs the "implement" phase for feature "token-cache"
    Then the pipeline result should be successful
    And feature "token-cache" should have status "completed"
    And the manifest phase should be "validate"
```

This replaces the previous re-implement of all three features.

- [ ] **Step 2: Update pipeline-error-resilience.feature scenario 3**

In the third scenario ("Failed validate produces regression but pipeline succeeds"), the end assertion currently has no feature-level check. Add one:

After line 85 (`And the manifest phase should be "implement"`), add:

```gherkin
    And feature "feat-a" should have status "completed"
    And feature "feat-b" should have status "pending"
```

And change the validate step to use the new targeted failure:

Replace:
```gherkin
    When the dispatch will write a validate artifact with status "failed"
```
With:
```gherkin
    When the dispatch will write a validate artifact with failures:
      | feature | result |
      | feat-a  | passed |
      | feat-b  | failed |
```

- [ ] **Step 3: Add validate-feedback.steps.ts to regression and error-resilience cucumber profiles**

In `cli/cucumber.json`:

1. Add `"features/step_definitions/validate-feedback.steps.ts"` to the `regression` profile's `import` array
2. Add `"features/step_definitions/validate-feedback.steps.ts"` to the `error-resilience` profile's `import` array
3. Add `"features/step_definitions/validate-feedback.steps.ts"` to the `pipeline-all` profile's `import` array
4. Add `"features/validate-feedback-loop.feature"` to the `pipeline-all` profile's `paths` array

- [ ] **Step 4: Run regression tests to verify**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile regression 2>&1 | tail -30`
Expected: PASS (after Task 3 is also complete and merged)

- [ ] **Step 5: Run error-resilience tests to verify**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile error-resilience 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add cli/features/regression-loop.feature cli/features/pipeline-error-resilience.feature cli/features/step_definitions/regression.steps.ts cli/cucumber.json
git commit -m "feat(validate-feedback-loop): update existing features for targeted re-dispatch"
```

---

### Task 5: Update Validate Skill

**Wave:** 4
**Depends on:** Task 3

**Files:**
- Modify: `skills/validate/SKILL.md`

- [ ] **Step 1: Update validate SKILL.md**

In `skills/validate/SKILL.md`, make these changes:

1. **Phase 2: Validate — section 2 (Determine Overall Status)**: Add feature-level failure identification. After running tests, the skill should identify which features failed by examining test output. Add after the existing "Determine Overall Status" section:

```markdown
### 2b. Identify Failing Features

If any test gate fails, identify which features are responsible:

1. Parse test output for feature-scoped test names (e.g., `*.integration.test.ts`, tagged with `@<feature-name>`)
2. Map failures to feature slugs using naming conventions
3. Record per-feature pass/fail results

If feature-level identification is not possible (tests are not feature-scoped), fall back to blanket failure.
```

2. **Phase 3: Checkpoint — section 1 (Save Report)**: Update frontmatter to include `failedFeatures`. Change the frontmatter example:

```markdown
```
---
phase: validate
slug: <epic-id>
epic: <epic-name>
status: passed
failedFeatures: feat-a,feat-b
---
```

- `failedFeatures` is a comma-separated list of feature slugs that failed validation
- Only present when `status: failed` and specific features can be identified
- When absent on failure, the pipeline falls back to blanket regression (all features reset)
```

3. **Phase 3: Checkpoint — section 2 (Commit and Handoff)**: Update the FAIL path:

```markdown
If FAIL:
```
Validation failed.
Failing features: <comma-separated list>
Re-dispatch count will increment for each failing feature (max 2 per feature).
The pipeline will automatically re-implement failing features.
```
STOP — do not proceed to commit.
```

- [ ] **Step 2: Commit**

```bash
git add skills/validate/SKILL.md
git commit -m "feat(validate-feedback-loop): update validate skill with targeted re-dispatch behavior"
```

---

### Task 6: Run Full Integration Test Suite

**Wave:** 5
**Depends on:** Task 3, Task 4

**Files:**
- Test: `cli/features/validate-feedback-loop.feature`
- Test: `cli/features/regression-loop.feature`
- Test: `cli/features/pipeline-error-resilience.feature`

- [ ] **Step 1: Run the new validate-feedback integration test**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile validate-feedback 2>&1`
Expected: PASS — both scenarios pass

- [ ] **Step 2: Run regression tests**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile regression 2>&1`
Expected: PASS

- [ ] **Step 3: Run error-resilience tests**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile error-resilience 2>&1`
Expected: PASS

- [ ] **Step 4: Run full pipeline-all suite**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile pipeline-all 2>&1`
Expected: PASS

- [ ] **Step 5: Run all unit tests**

Run: `cd cli && bun --bun vitest run 2>&1`
Expected: PASS

- [ ] **Step 6: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(validate-feedback-loop): integration test fixes"
```
