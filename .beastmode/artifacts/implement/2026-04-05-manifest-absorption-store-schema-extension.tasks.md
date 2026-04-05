# Store Schema Extension — Implementation Tasks

## Goal

Extend the store module's type system and API to support the manifest-absorption migration: add feature slug field, move slug utilities into the store, add slug deduplication, extend `find()` for feature slugs, define `EnrichedEpic` and `NextAction` types, and update `summary` to support the object shape.

## Architecture

- **Store module** (`cli/src/store/`) — sole location for entity types, CRUD, queries
- **Three-tier identity model** — id (permanent), slug (immutable), name (mutable)
- **Slug normalization** — kebab-case via `slugify()`, validated by `isValidSlug()`
- **Slug deduplication** — on collision, append `-xxxx` suffix derived from entity ID hash
- **EnrichedEpic** — Epic + XState-derived `nextAction` field (replaces `EnrichedManifest`)

## Tech Stack

- TypeScript, Bun test runner (`bun:test`), Cucumber.js for BDD
- XState v5.30 for pipeline state machine
- `InMemoryTaskStore` for test doubles

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `cli/src/store/types.ts` | Modify | Add `slug` to Feature, update `FeaturePatch`, add `EnrichedEpic`, `NextAction`, update `summary` type, update `addFeature` signature |
| `cli/src/store/slug.ts` | Create | `slugify()`, `isValidSlug()`, `deduplicateSlug()` — pure slug utilities |
| `cli/src/store/in-memory.ts` | Modify | Update `addFeature()` to accept slug, normalize via slugify, deduplicate; update `find()` to resolve feature slugs |
| `cli/src/store/index.ts` | Modify | Re-export slug utilities and new types |
| `cli/src/store/slug.test.ts` | Create | Unit tests for slug utilities |
| `cli/src/store/in-memory.test.ts` | Modify | Add tests for feature slug, slug dedup, find-by-feature-slug |
| `cli/features/store/store-schema-extension.feature` | Create | BDD integration test from Gherkin scenarios |
| `cli/features/store/step_definitions/store-schema-extension.steps.ts` | Create | Step definitions for schema extension scenarios |
| `cli/cucumber.json` | Modify | Add `store-schema-extension` profile |
| `cli/features/store/support/store-world.ts` | Modify | Add slug-aware helper methods |

---

### Task 0: Integration Test from Gherkin

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/features/store/store-schema-extension.feature`
- Create: `cli/features/store/step_definitions/store-schema-extension.steps.ts`
- Modify: `cli/cucumber.json`
- Modify: `cli/features/store/support/store-world.ts`

- [x] **Step 1: Create the Gherkin feature file**

```gherkin
# cli/features/store/store-schema-extension.feature
@manifest-absorption
Feature: Store schema supports feature slugs and slug utilities

  Features carry a slug field following the three-tier identity model
  (id, slug, name). The store provides slug normalization and
  deduplication so that human-readable identifiers are unique across
  all entities.

  Background:
    Given a store is initialized

  Scenario: Feature entity carries a slug field
    Given an epic "auth-system" exists in the store
    When a developer creates a feature "login-flow" under "auth-system" with slug "login-flow"
    Then the feature should have slug "login-flow"
    And the feature should be retrievable by slug "login-flow"

  Scenario: Slug is normalized to kebab-case
    Given an epic "auth-system" exists in the store
    When a developer creates a feature with raw slug "Login Flow!"
    Then the feature slug should be normalized to "login-flow"

  Scenario: Duplicate slug receives a disambiguating suffix
    Given an epic "auth-system" exists in the store
    And a feature with slug "login-flow" already exists
    When a developer creates another feature with slug "login-flow"
    Then the new feature slug should have a unique suffix appended
    And both features should be retrievable by their distinct slugs

  Scenario: Store is the sole pipeline state file
    Given a store contains epics with features, dependencies, and phase status
    When a developer inspects the pipeline state
    Then all pipeline state is contained in a single store file
    And no separate manifest files are required

  Scenario: Epic entity carries slug and name fields
    Given a store is initialized
    When a developer creates an epic with slug "manifest-absorption" and name "Manifest Absorption"
    Then the epic should have slug "manifest-absorption"
    And the epic should have name "Manifest Absorption"
    And the epic slug should be immutable after creation
```

- [x] **Step 2: Add slug-aware helpers to StoreWorld**

Add the following helpers to `cli/features/store/support/store-world.ts`:

```typescript
/** Helper: create a feature with explicit slug */
createFeatureWithSlug(name: string, epicName: string, slug: string): Feature {
  const epic = this.getEpicByName(epicName);
  const feature = this.store.addFeature({ parent: epic.id, name, slug });
  this.featuresByName.set(name, feature);
  return feature;
}
```

- [x] **Step 3: Write step definitions**

Create `cli/features/store/step_definitions/store-schema-extension.steps.ts` with step definitions for all scenarios. Steps use `StoreWorld` helpers and assert against the store's `find()` and entity fields.

- [x] **Step 4: Add cucumber profile**

Add `store-schema-extension` profile to `cli/cucumber.json`:

```json
"store-schema-extension": {
  "paths": ["features/store/store-schema-extension.feature"],
  "import": [
    "features/store/step_definitions/store-schema-extension.steps.ts",
    "features/store/step_definitions/store-entity.steps.ts",
    "features/store/support/store-world.ts",
    "features/store/support/store-hooks.ts"
  ],
  "format": ["progress-bar"],
  "publishQuiet": true
}
```

- [x] **Step 5: Run integration test to verify RED state**

Run: `cd cli && npx cucumber-js --profile store-schema-extension`
Expected: FAIL — Feature interface has no `slug` field yet, `addFeature()` doesn't accept `slug`, `find()` doesn't resolve features by slug.

- [x] **Step 6: Commit**

```bash
git add cli/features/store/store-schema-extension.feature cli/features/store/step_definitions/store-schema-extension.steps.ts cli/cucumber.json cli/features/store/support/store-world.ts
git commit -m "test(store-schema-extension): add BDD integration test (RED)"
```

---

### Task 1: Slug Utilities Module

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/src/store/slug.ts`
- Create: `cli/src/store/slug.test.ts`
- Modify: `cli/src/store/index.ts`

- [x] **Step 1: Write failing tests for slug utilities**

Create `cli/src/store/slug.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";
import { slugify, isValidSlug, deduplicateSlug } from "./slug.js";

describe("slugify", () => {
  it("should lowercase and hyphenate", () => {
    expect(slugify("Login Flow")).toBe("login-flow");
  });

  it("should strip special characters", () => {
    expect(slugify("Login Flow!")).toBe("login-flow");
  });

  it("should collapse multiple hyphens", () => {
    expect(slugify("a--b---c")).toBe("a-b-c");
  });

  it("should strip leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("should throw on empty input", () => {
    expect(() => slugify("")).toThrow("Cannot slugify");
  });

  it("should throw on all-special-character input", () => {
    expect(() => slugify("!!!")).toThrow("Cannot slugify");
  });

  it("should preserve already-valid slugs", () => {
    expect(slugify("auth-system")).toBe("auth-system");
  });
});

describe("isValidSlug", () => {
  it("should accept valid slugs", () => {
    expect(isValidSlug("auth-system")).toBe(true);
    expect(isValidSlug("a")).toBe(true);
    expect(isValidSlug("abc123")).toBe(true);
  });

  it("should reject leading hyphens", () => {
    expect(isValidSlug("-auth")).toBe(false);
  });

  it("should reject trailing hyphens", () => {
    expect(isValidSlug("auth-")).toBe(false);
  });

  it("should reject uppercase", () => {
    expect(isValidSlug("Auth")).toBe(false);
  });

  it("should reject special characters", () => {
    expect(isValidSlug("auth!system")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });
});

describe("deduplicateSlug", () => {
  it("should return slug unchanged when no collision", () => {
    const existing = new Set<string>();
    expect(deduplicateSlug("login-flow", "bm-a1b2.1", existing)).toBe("login-flow");
  });

  it("should append suffix on collision", () => {
    const existing = new Set(["login-flow"]);
    const result = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    expect(result).not.toBe("login-flow");
    expect(result.startsWith("login-flow-")).toBe(true);
    expect(isValidSlug(result)).toBe(true);
  });

  it("should produce deterministic suffix from entity ID", () => {
    const existing = new Set(["login-flow"]);
    const result1 = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    const result2 = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    expect(result1).toBe(result2);
  });

  it("should produce different suffixes for different IDs", () => {
    const existing = new Set(["login-flow"]);
    const result1 = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    const result2 = deduplicateSlug("login-flow", "bm-c3d4.2", existing);
    expect(result1).not.toBe(result2);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun test src/store/slug.test.ts`
Expected: FAIL — `slug.ts` doesn't exist yet.

- [x] **Step 3: Implement slug utilities**

Create `cli/src/store/slug.ts`:

```typescript
/**
 * Slug utilities for the store module.
 *
 * Moved from manifest/store.ts to the store module as part of
 * the manifest-absorption migration.
 */

/** Slug format: lowercase alphanumeric with optional hyphens, no leading/trailing hyphens */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/**
 * Validate a string against the slug format.
 */
export function isValidSlug(input: string): boolean {
  return SLUG_PATTERN.test(input);
}

/**
 * Normalize a string to a valid slug.
 * Lowercases, replaces non-alphanumeric with hyphens, collapses multiple hyphens,
 * strips leading/trailing hyphens.
 */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (slug.length === 0) {
    throw new Error(`Cannot slugify empty or all-special-character input: "${input}"`);
  }
  return slug;
}

/**
 * Simple hash function for generating deterministic suffixes from entity IDs.
 * Returns a 4-character hex string.
 */
function hashId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return (hash >>> 0).toString(16).padStart(4, "0").slice(0, 4);
}

/**
 * Deduplicate a slug by appending a suffix derived from the entity ID hash.
 * Returns the original slug if no collision, or `slug-xxxx` if collision detected.
 */
export function deduplicateSlug(slug: string, entityId: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  const suffix = hashId(entityId);
  return `${slug}-${suffix}`;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun test src/store/slug.test.ts`
Expected: PASS

- [x] **Step 5: Export from barrel**

Add to `cli/src/store/index.ts`:

```typescript
export { slugify, isValidSlug, deduplicateSlug } from "./slug.js";
```

- [x] **Step 6: Commit**

```bash
git add cli/src/store/slug.ts cli/src/store/slug.test.ts cli/src/store/index.ts
git commit -m "feat(store): add slug utilities (slugify, isValidSlug, deduplicateSlug)"
```

---

### Task 2: Feature Slug Field and Type Extensions

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/store/types.ts`

- [x] **Step 1: Write type assertions (compile-time tests)**

The type changes are verified by the unit tests in Tasks 3 and 4. This task focuses on the type definitions alone.

- [x] **Step 2: Add slug field to Feature interface**

In `cli/src/store/types.ts`, add `slug` to the `Feature` interface:

```typescript
export interface Feature {
  id: string;
  type: "feature";
  parent: string;
  name: string;
  slug: string;
  description?: string;
  status: FeatureStatus;
  plan?: string;
  implement?: string;
  depends_on: string[];
  created_at: string;
  updated_at: string;
}
```

- [x] **Step 3: Update addFeature signature in TaskStore interface**

In `cli/src/store/types.ts`, update the `addFeature` signature:

```typescript
addFeature(opts: { parent: string; name: string; slug?: string; description?: string }): Feature;
```

- [x] **Step 4: Add EnrichedEpic and NextAction types**

In `cli/src/store/types.ts`, add after the TreeNode interface:

```typescript
// --- Enrichment Types ---

export interface NextAction {
  phase: string;
  args: string[];
  type: "single" | "fan-out";
  features?: string[];
}

export interface EnrichedEpic extends Epic {
  nextAction: NextAction | null;
}
```

- [x] **Step 5: Update Epic summary to support object shape**

In `cli/src/store/types.ts`, update the `summary` field on `Epic`:

```typescript
summary?: string | { problem: string; solution: string };
```

- [x] **Step 6: Update barrel exports**

In `cli/src/store/index.ts`, add `NextAction` and `EnrichedEpic` to the type exports:

```typescript
export type {
  TaskStore,
  Entity,
  Epic,
  Feature,
  EpicPatch,
  FeaturePatch,
  TreeNode,
  EntityType,
  EpicStatus,
  FeatureStatus,
  NextAction,
  EnrichedEpic,
} from "./types.js";
```

- [x] **Step 7: Verify build compiles**

Run: `cd cli && npx tsc --noEmit`
Expected: Compilation errors in `in-memory.ts` — `addFeature()` doesn't set `slug` yet (expected, fixed in Task 3)

- [x] **Step 8: Commit**

```bash
git add cli/src/store/types.ts cli/src/store/index.ts
git commit -m "feat(store): add Feature.slug, EnrichedEpic, NextAction, summary object shape"
```

---

### Task 3: InMemoryTaskStore — Feature Slug Support

**Wave:** 2
**Depends on:** Task 1, Task 2

**Files:**
- Modify: `cli/src/store/in-memory.ts`
- Modify: `cli/src/store/in-memory.test.ts`

- [x] **Step 1: Write failing tests for feature slug in addFeature**

Add to `cli/src/store/in-memory.test.ts` inside the `Feature CRUD` describe block:

```typescript
it("should add a feature with explicit slug", () => {
  const epic = store.addEpic({ name: "Test Epic" });
  const feature = store.addFeature({ parent: epic.id, name: "Login Flow", slug: "login-flow" });
  expect(feature.slug).toBe("login-flow");
});

it("should derive slug from name when not provided", () => {
  const epic = store.addEpic({ name: "Test Epic" });
  const feature = store.addFeature({ parent: epic.id, name: "Login Flow" });
  expect(feature.slug).toBe("login-flow");
});

it("should normalize slug via slugify", () => {
  const epic = store.addEpic({ name: "Test Epic" });
  const feature = store.addFeature({ parent: epic.id, name: "Test", slug: "Login Flow!" });
  expect(feature.slug).toBe("login-flow");
});

it("should deduplicate slug on collision", () => {
  const epic = store.addEpic({ name: "Test Epic" });
  const f1 = store.addFeature({ parent: epic.id, name: "Login Flow", slug: "login-flow" });
  const f2 = store.addFeature({ parent: epic.id, name: "Login Flow 2", slug: "login-flow" });
  expect(f1.slug).toBe("login-flow");
  expect(f2.slug).not.toBe("login-flow");
  expect(f2.slug.startsWith("login-flow-")).toBe(true);
});

it("should deduplicate slug across epics", () => {
  const epic1 = store.addEpic({ name: "Epic 1" });
  const epic2 = store.addEpic({ name: "Epic 2" });
  const f1 = store.addFeature({ parent: epic1.id, name: "Login", slug: "login-flow" });
  const f2 = store.addFeature({ parent: epic2.id, name: "Login", slug: "login-flow" });
  expect(f1.slug).toBe("login-flow");
  expect(f2.slug).not.toBe("login-flow");
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun test src/store/in-memory.test.ts`
Expected: FAIL — `addFeature()` doesn't accept `slug` or set it on the entity.

- [x] **Step 3: Update addFeature in InMemoryTaskStore**

In `cli/src/store/in-memory.ts`:

1. Add import for slug utilities:
```typescript
import { slugify, deduplicateSlug } from "./slug.js";
```

2. Add helper method to collect all existing slugs:
```typescript
private collectSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const entity of this.entities.values()) {
    if ('slug' in entity) {
      slugs.add(entity.slug);
    }
  }
  return slugs;
}
```

3. Update `addFeature()`:
```typescript
addFeature(opts: { parent: string; name: string; slug?: string; description?: string }): Feature {
  const parentEpic = this.getEpic(opts.parent);
  if (!parentEpic) throw new Error(`Parent epic not found: ${opts.parent}`);

  const id = this.generateFeatureId(opts.parent);
  const rawSlug = opts.slug ?? opts.name;
  const normalizedSlug = slugify(rawSlug);
  const existingSlugs = this.collectSlugs();
  const finalSlug = deduplicateSlug(normalizedSlug, id, existingSlugs);

  const feature: Feature = {
    id,
    type: "feature",
    parent: opts.parent,
    name: opts.name,
    slug: finalSlug,
    description: opts.description,
    status: "pending",
    depends_on: [],
    created_at: this.now(),
    updated_at: this.now(),
  };
  this.entities.set(id, feature);
  return feature;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun test src/store/in-memory.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add cli/src/store/in-memory.ts cli/src/store/in-memory.test.ts
git commit -m "feat(store): feature slug support in addFeature with deduplication"
```

---

### Task 4: Store find() Enhancement for Feature Slugs

**Wave:** 2
**Depends on:** Task 2

**Files:**
- Modify: `cli/src/store/in-memory.ts`
- Modify: `cli/src/store/in-memory.test.ts`
- Modify: `cli/src/store/resolve.ts`
- Modify: `cli/src/store/resolve.test.ts`

- [x] **Step 1: Write failing tests for find-by-feature-slug**

Add to `cli/src/store/in-memory.test.ts` inside the `Queries` describe block:

```typescript
describe("find by feature slug", () => {
  it("should find feature by slug", () => {
    const epic = store.addEpic({ name: "Test Epic" });
    const feature = store.addFeature({ parent: epic.id, name: "Login Flow", slug: "login-flow" });
    const found = store.find("login-flow");
    expect(found).toBeDefined();
    expect(found!.id).toBe(feature.id);
  });

  it("should prefer epic slug over feature slug", () => {
    const epic = store.addEpic({ name: "Auth", slug: "auth" });
    store.addFeature({ parent: epic.id, name: "Auth Feature", slug: "auth" });
    const found = store.find("auth");
    expect(found).toBeDefined();
    expect(found!.type).toBe("epic");
  });

  it("should find feature slug when no epic slug matches", () => {
    const epic = store.addEpic({ name: "My Epic", slug: "my-epic" });
    store.addFeature({ parent: epic.id, name: "Auth Feature", slug: "auth-feature" });
    const found = store.find("auth-feature");
    expect(found).toBeDefined();
    expect(found!.type).toBe("feature");
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun test src/store/in-memory.test.ts`
Expected: FAIL — `find()` only checks epic slugs, not feature slugs.

- [x] **Step 3: Update find() in InMemoryTaskStore**

In `cli/src/store/in-memory.ts`, update the `find` method:

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

- [x] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun test src/store/in-memory.test.ts`
Expected: PASS

- [x] **Step 5: Update resolve.ts to also scan feature slugs**

In `cli/src/store/resolve.ts`, update Step 2 to also scan features:

```typescript
// Step 2: Try as slug — scan epics and features for slug match
// Only add if it's a different entity than what we found by ID
const epics = store.listEpics();
for (const epic of epics) {
  if (epic.slug === identifier && epic.id !== identifier) {
    matches.push(epic);
  }
}

// Also check feature slugs if no epic slug matched
if (matches.length === 0 || (matches.length === 1 && matches[0] === byId)) {
  // Scan all epics for features with matching slug
  for (const epic of epics) {
    const features = store.listFeatures(epic.id);
    for (const feature of features) {
      if (feature.slug === identifier && feature.id !== identifier) {
        matches.push(feature);
      }
    }
  }
}
```

- [x] **Step 6: Add resolve.test.ts tests for feature slug resolution**

Add to `cli/src/store/resolve.test.ts`:

```typescript
describe("feature slug resolution", () => {
  it("should resolve feature by slug", () => {
    const epic = store.addEpic({ name: "Epic", slug: "epic" });
    const feature = store.addFeature({ parent: epic.id, name: "Login", slug: "login-flow" });
    const result = resolveIdentifier(store, "login-flow");
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.id).toBe(feature.id);
    }
  });

  it("should prefer epic slug over feature slug", () => {
    const epic = store.addEpic({ name: "Auth", slug: "auth" });
    store.addFeature({ parent: epic.id, name: "Auth Feature", slug: "auth" });
    const result = resolveIdentifier(store, "auth");
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.type).toBe("epic");
    }
  });

  it("should resolve feature slug to parent epic when resolveToEpic is true", () => {
    const epic = store.addEpic({ name: "Epic", slug: "epic" });
    store.addFeature({ parent: epic.id, name: "Login", slug: "login-flow" });
    const result = resolveIdentifier(store, "login-flow", { resolveToEpic: true });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.id).toBe(epic.id);
    }
  });
});
```

- [x] **Step 7: Run resolve tests**

Run: `cd cli && bun test src/store/resolve.test.ts`
Expected: PASS

- [x] **Step 8: Commit**

```bash
git add cli/src/store/in-memory.ts cli/src/store/in-memory.test.ts cli/src/store/resolve.ts cli/src/store/resolve.test.ts
git commit -m "feat(store): find() resolves features by slug, resolve.ts updated"
```

---

### Task 5: Full Test Suite Verification

**Wave:** 3
**Depends on:** Task 3, Task 4

**Files:**
- Modify: `cli/features/store/support/store-world.ts` (if needed for existing test compat)

- [x] **Step 1: Run existing store BDD tests**

Run: `cd cli && npx cucumber-js --profile store`
Expected: PASS — existing store tests should pass (addFeature calls without slug will auto-derive slug from name)

- [x] **Step 2: Run all unit tests**

Run: `cd cli && bun test`
Expected: PASS — all existing tests still work

- [ ] **Step 3: Run integration test to verify GREEN state**

Run: `cd cli && npx cucumber-js --profile store-schema-extension`
Expected: PASS — all scenarios should now pass with the implemented feature slug support

- [ ] **Step 4: Fix any failures found**

If any tests fail, analyze the failure, fix the issue, and re-run.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix(store): test compatibility adjustments for schema extension"
```

Only commit if there were fixes. Skip if all tests passed cleanly.
