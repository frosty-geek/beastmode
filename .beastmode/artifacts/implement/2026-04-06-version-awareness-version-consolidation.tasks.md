# Version Consolidation — Implementation Tasks

## Goal

Consolidate all version displays across the CLI and dashboard to read from `.claude-plugin/plugin.json` as the single source of truth. Create a shared version module (`cli/src/version.ts`), remove the hardcoded VERSION constant, replace the watch loop's local `resolveVersion()`, and update all existing tests to expect the new `v{semver}` format (no git hash).

## Architecture

- **Single source of truth:** `.claude-plugin/plugin.json` — the release skill already bumps this file
- **Shared module:** `cli/src/version.ts` exports `resolveVersion()` using `import.meta.dirname` to navigate to plugin.json (2 levels up from `cli/src/` to project root)
- **Display format:** `v{semver}` only (e.g., `v0.102.0`). No git hash.
- **Fallback:** `"unknown"` on any read/parse failure
- **npx CLI:** Untouched — already reads plugin.json correctly on Node.js ESM runtime

## Tech Stack

- Runtime: Bun (TypeScript)
- Test runner: vitest (`bun --bun vitest run`)
- BDD: Cucumber.js (`bun --bun node_modules/.bin/cucumber-js`)
- Feature tests: source-analysis style (no React rendering)

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/version.ts` | Create | Shared version module — `resolveVersion()` reads plugin.json |
| `cli/src/__tests__/version.test.ts` | Create | Unit tests for the shared version module |
| `cli/src/index.ts` | Modify | Remove hardcoded VERSION, import from shared module |
| `cli/src/commands/watch-loop.ts` | Modify | Remove local `resolveVersion()`, import from shared module |
| `cli/src/__tests__/version-display.test.ts` | Modify | Update assertions from `v{semver} ({hash})` to `v{semver}` |
| `cli/features/version-display.feature` | Modify | Update feature description to remove "git hash" reference |
| `cli/features/version-consolidation.feature` | Create | Integration test from Gherkin scenarios |
| `cli/features/step_definitions/version-consolidation.steps.ts` | Create | Step definitions for integration test |
| `cli/cucumber.json` | Modify | Add `version-consolidation` profile |

---

### Task 0: Integration Test (BDD RED)

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/features/version-consolidation.feature`
- Create: `cli/features/step_definitions/version-consolidation.steps.ts`
- Modify: `cli/cucumber.json`

- [x] **Step 1: Create the integration test feature file**

```gherkin
@version-awareness
Feature: Version resolution from plugin.json

  All version displays across the CLI and dashboard resolve from
  .claude-plugin/plugin.json as the single source of truth. The shared
  version module discovers plugin.json relative to its own file location
  and formats the result as "v{semver}". When plugin.json is unreadable,
  the module returns "unknown" instead of crashing.

  Scenario: Shared version module exists and exports resolveVersion
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the module exports a "resolveVersion" function

  Scenario: Version module reads from plugin.json
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the module references "plugin.json" in its file read

  Scenario: Version module uses import.meta.dirname for path resolution
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the module uses "import.meta.dirname" for path traversal

  Scenario: CLI help imports the shared version module
    Given the CLI source tree is loaded
    When I examine the CLI entry point at "index.ts"
    Then it imports from the version module
    And it does not contain a hardcoded VERSION constant

  Scenario: Watch loop imports the shared version module
    Given the CLI source tree is loaded
    When I examine the watch loop at "commands/watch-loop.ts"
    Then it imports from the version module
    And it does not contain a local resolveVersion function

  Scenario: Version format is v{semver} without git hash
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the return format matches "v{semver}" pattern
    And the module does not reference "git rev-parse" or "execSync"
```

Write this file to `cli/features/version-consolidation.feature`.

- [x] **Step 2: Create the step definitions**

```typescript
/**
 * Step definitions for version-consolidation integration tests.
 *
 * Tests verify structural properties of the CLI source code
 * for the version consolidation feature.
 * Source analysis only — no runtime execution.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CLI_SRC = resolve(import.meta.dirname, "../../src");

interface VersionConsolidationWorld {
  sources: Map<string, string>;
  currentSource: string;
}

Given("the CLI source tree is loaded", function (this: VersionConsolidationWorld) {
  this.sources = new Map();
  const files = [
    "version.ts",
    "index.ts",
    "commands/watch-loop.ts",
  ];
  for (const file of files) {
    const fullPath = resolve(CLI_SRC, file);
    if (existsSync(fullPath)) {
      this.sources.set(file, readFileSync(fullPath, "utf-8"));
    }
  }
});

When("I examine the version module at {string}", function (this: VersionConsolidationWorld, path: string) {
  const source = this.sources.get(path);
  assert.ok(source, `Source file "${path}" should exist`);
  this.currentSource = source;
});

When("I examine the CLI entry point at {string}", function (this: VersionConsolidationWorld, path: string) {
  const source = this.sources.get(path);
  assert.ok(source, `Source file "${path}" should exist`);
  this.currentSource = source;
});

When("I examine the watch loop at {string}", function (this: VersionConsolidationWorld, path: string) {
  const source = this.sources.get(path);
  assert.ok(source, `Source file "${path}" should exist`);
  this.currentSource = source;
});

Then("the module exports a {string} function", function (this: VersionConsolidationWorld, funcName: string) {
  assert.ok(
    this.currentSource.includes(`export function ${funcName}`) ||
    this.currentSource.includes(`export { ${funcName}`) ||
    this.currentSource.includes(`export const ${funcName}`),
    `Module should export "${funcName}"`
  );
});

Then("the module references {string} in its file read", function (this: VersionConsolidationWorld, filename: string) {
  assert.ok(
    this.currentSource.includes(filename),
    `Module should reference "${filename}"`
  );
});

Then("the module uses {string} for path traversal", function (this: VersionConsolidationWorld, api: string) {
  assert.ok(
    this.currentSource.includes(api),
    `Module should use "${api}"`
  );
});

Then("it imports from the version module", function (this: VersionConsolidationWorld) {
  assert.ok(
    this.currentSource.includes('from "./version') ||
    this.currentSource.includes('from "../version'),
    "Should import from the version module"
  );
});

Then("it does not contain a hardcoded VERSION constant", function (this: VersionConsolidationWorld) {
  const hardcoded = this.currentSource.match(/const VERSION\s*=\s*["']\d+\.\d+\.\d+["']/);
  assert.ok(!hardcoded, "Should not contain a hardcoded VERSION constant");
});

Then("it does not contain a local resolveVersion function", function (this: VersionConsolidationWorld) {
  const localFunc = this.currentSource.match(/^function resolveVersion/m);
  assert.ok(!localFunc, "Should not contain a local resolveVersion function definition");
});

Then("the return format matches {string} pattern", function (this: VersionConsolidationWorld, _pattern: string) {
  assert.ok(
    this.currentSource.includes("`v${") || this.currentSource.includes('"v" +') || this.currentSource.includes("'v' +"),
    "Return format should prefix with 'v'"
  );
});

Then("the module does not reference {string} or {string}", function (this: VersionConsolidationWorld, ref1: string, ref2: string) {
  assert.ok(!this.currentSource.includes(ref1), `Module should not reference "${ref1}"`);
  assert.ok(!this.currentSource.includes(ref2), `Module should not reference "${ref2}"`);
});
```

Write this file to `cli/features/step_definitions/version-consolidation.steps.ts`.

- [x] **Step 3: Add cucumber profile for version-consolidation**

Read `cli/cucumber.json`, then add a new `"version-consolidation"` profile entry after the existing `"version-display"` entry:

```json
"version-consolidation": {
  "paths": ["features/version-consolidation.feature"],
  "import": [
    "features/step_definitions/version-consolidation.steps.ts"
  ],
  "format": ["progress-bar"],
  "publishQuiet": true
}
```

- [x] **Step 4: Run integration test — expect RED**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile version-consolidation`
Expected: FAIL — `version.ts` does not exist yet, so "the CLI source tree is loaded" will find no version.ts and subsequent steps will fail.

- [x] **Step 5: Commit**

```bash
git add cli/features/version-consolidation.feature cli/features/step_definitions/version-consolidation.steps.ts cli/cucumber.json
git commit -m "test(version-consolidation): add BDD integration test (RED)"
```

---

### Task 1: Shared Version Module

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/src/version.ts`
- Create: `cli/src/__tests__/version.test.ts`

- [x] **Step 1: Write the unit tests for the shared version module**

```typescript
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

describe("resolveVersion", () => {
  const fixtureRoot = resolve(import.meta.dirname, "__fixtures__/version-test");
  const pluginDir = resolve(fixtureRoot, ".claude-plugin");
  const pluginJsonPath = resolve(pluginDir, "plugin.json");

  beforeEach(() => {
    mkdirSync(pluginDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(fixtureRoot, { recursive: true, force: true });
  });

  test("resolves version from plugin.json", async () => {
    writeFileSync(pluginJsonPath, JSON.stringify({ version: "1.2.3" }));
    const { resolveVersion } = await import("../version.js");
    const result = resolveVersion(fixtureRoot);
    expect(result).toBe("v1.2.3");
  });

  test("returns 'unknown' when plugin.json is missing", async () => {
    rmSync(pluginDir, { recursive: true, force: true });
    const { resolveVersion } = await import("../version.js");
    const result = resolveVersion(resolve(fixtureRoot, "nonexistent"));
    expect(result).toBe("unknown");
  });

  test("returns 'unknown' when plugin.json contains invalid JSON", async () => {
    writeFileSync(pluginJsonPath, "not valid json{{{");
    const { resolveVersion } = await import("../version.js");
    const result = resolveVersion(fixtureRoot);
    expect(result).toBe("unknown");
  });

  test("returns 'unknown' when plugin.json has no version field", async () => {
    writeFileSync(pluginJsonPath, JSON.stringify({ name: "test" }));
    const { resolveVersion } = await import("../version.js");
    const result = resolveVersion(fixtureRoot);
    expect(result).toBe("unknown");
  });

  test("resolveVersion with no argument uses import.meta.dirname", async () => {
    const { resolveVersion } = await import("../version.js");
    // When called without argument, it should not throw
    const result = resolveVersion();
    expect(typeof result).toBe("string");
  });
});
```

Write this file to `cli/src/__tests__/version.test.ts`.

- [x]**Step 2: Run test to verify it fails**

Run: `cd cli && bun --bun vitest run src/__tests__/version.test.ts`
Expected: FAIL — `../version.js` module does not exist yet.

- [x]**Step 3: Write the shared version module**

```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Resolve the current beastmode version from .claude-plugin/plugin.json.
 *
 * When called without arguments, discovers the project root relative to
 * this module's own location (2 levels up from cli/src/ to project root).
 * Returns "v{semver}" on success, "unknown" on any failure.
 */
export function resolveVersion(projectRoot?: string): string {
  try {
    const root = projectRoot ?? resolve(import.meta.dirname, "..", "..");
    const pluginJsonPath = resolve(root, ".claude-plugin", "plugin.json");
    const content = JSON.parse(readFileSync(pluginJsonPath, "utf-8"));
    const version = content.version;
    if (typeof version !== "string" || !version) return "unknown";
    return `v${version}`;
  } catch {
    return "unknown";
  }
}
```

Write this file to `cli/src/version.ts`.

- [x]**Step 4: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/__tests__/version.test.ts`
Expected: PASS

- [x]**Step 5: Commit**

```bash
git add cli/src/version.ts cli/src/__tests__/version.test.ts
git commit -m "feat(version-consolidation): add shared version module"
```

---

### Task 2: CLI Help Consumer

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/index.ts` (lines 14, 17)

- [x]**Step 1: Write the failing test**

No separate test file — the existing integration test (Task 0) covers this. The modification is verified by the BDD scenario "CLI help imports the shared version module".

- [x]**Step 2: Modify cli/src/index.ts**

1. Remove line 14: `const VERSION = "0.1.0";`
2. Add import: `import { resolveVersion } from "./version";`
3. Change line 17 from `beastmode v${VERSION}` to `beastmode ${resolveVersion()}`

The resulting file should have:
- Import `resolveVersion` from `"./version"` added to the import block
- No `const VERSION = "0.1.0"` line
- Help banner uses `resolveVersion()` call

- [x]**Step 3: Verify the change**

Run: `cd cli && bun run src/index.ts help`
Expected: Output includes `beastmode v0.102.0` (reading from plugin.json)

- [x]**Step 4: Commit**

```bash
git add cli/src/index.ts
git commit -m "feat(version-consolidation): CLI help uses shared version module"
```

---

### Task 3: Watch Loop Consumer

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/commands/watch-loop.ts` (lines 19-21, 30-41, 92)

- [x]**Step 1: Modify watch-loop.ts**

1. Remove the local `resolveVersion` function (lines 30-41, including the `// --- Version banner ---` comment on line 30)
2. Remove unused imports that were only needed by the old function:
   - Remove `readFileSync` from the `node:fs` import (keep `existsSync` if still used)
   - Remove `resolve` from the `node:path` import (keep if still used elsewhere)
   - Remove the `execSync` import from `node:child_process` entirely
3. Add import: `import { resolveVersion } from "../version.js";`
4. Change line 92 from `const version = resolveVersion(this.config.projectRoot);` to `const version = resolveVersion();`

Check whether `readFileSync`, `resolve`, `existsSync` are used elsewhere in the file before removing them from imports.

- [x]**Step 2: Verify the imports are clean**

Run: `cd cli && bun build src/commands/watch-loop.ts --outdir /dev/null 2>&1 || true`
Check: No unused import warnings. No missing import errors.

- [x]**Step 3: Run the full test suite**

Run: `cd cli && bun --bun vitest run`
Expected: PASS (no tests directly test watch-loop.ts internals; the version-display tests will be updated in Task 5)

- [x]**Step 4: Commit**

```bash
git add cli/src/commands/watch-loop.ts
git commit -m "feat(version-consolidation): watch loop uses shared version module"
```

---

### Task 4: Update Version Display Unit Tests

**Wave:** 3
**Depends on:** Task 2, Task 3

**Files:**
- Modify: `cli/src/__tests__/version-display.test.ts`

- [x]**Step 1: Update version-display.test.ts**

Replace the entire file content. The key changes:
- All version strings change from `"v0.96.0 (a1b2c3d)"` format to `"v0.96.0"` format
- Remove the two git hash tests ("contains abbreviated git hash in parentheses" and "git hash is exactly seven characters")
- Replace with tests that verify the version does NOT contain a hash

```typescript
import { describe, test, expect } from "vitest";

// ---------------------------------------------------------------------------
// Version state management logic
// ---------------------------------------------------------------------------

describe("version capture from started event", () => {
  test("extracts version string from started event payload", () => {
    const payload = { version: "v0.96.0", pid: 12345, intervalSeconds: 30 };
    const captured = payload.version;
    expect(captured).toBe("v0.96.0");
  });

  test("version is null before started event fires", () => {
    const version: string | null = null;
    expect(version).toBeNull();
  });

  test("version updates when started event fires", () => {
    let version: string | null = null;
    const onStarted = (ev: { version: string }) => {
      version = ev.version;
    };
    onStarted({ version: "v0.97.0" });
    expect(version).toBe("v0.97.0");
  });
});

// ---------------------------------------------------------------------------
// Version display formatting
// ---------------------------------------------------------------------------

describe("version display rendering logic", () => {
  test("version prop is passed when state is non-null", () => {
    const version: string | null = "v0.96.0";
    const propValue = version ?? undefined;
    expect(propValue).toBe("v0.96.0");
  });

  test("version prop is undefined when state is null", () => {
    const version: string | null = null;
    const propValue = version ?? undefined;
    expect(propValue).toBeUndefined();
  });

  test("version string is clean semver without git hash", () => {
    const version = "v0.96.0";
    const hashMatch = version.match(/\([a-f0-9]+\)/);
    expect(hashMatch).toBeNull();
  });

  test("version string matches v{semver} format", () => {
    const version = "v0.96.0";
    const semverMatch = version.match(/^v\d+\.\d+\.\d+$/);
    expect(semverMatch).not.toBeNull();
  });
});
```

Write this to `cli/src/__tests__/version-display.test.ts`.

- [x]**Step 2: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/__tests__/version-display.test.ts`
Expected: PASS

- [x]**Step 3: Commit**

```bash
git add cli/src/__tests__/version-display.test.ts
git commit -m "test(version-consolidation): update version-display tests for v{semver} format"
```

---

### Task 5: Update BDD Feature Description

**Wave:** 3
**Depends on:** Task 2, Task 3

**Files:**
- Modify: `cli/features/version-display.feature` (lines 1-6)

- [x]**Step 1: Update version-display.feature**

Change the feature tag and description. Replace:

```gherkin
@dashboard-log-fixes
Feature: Dashboard header displays current version and git hash

  The dashboard header shows the current build version and abbreviated
  git commit hash below the clock in the top-right region, so the
  operator can identify which build is running.
```

With:

```gherkin
@dashboard-log-fixes
Feature: Dashboard header displays current version

  The dashboard header shows the current build version from
  plugin.json below the clock in the top-right region, so the
  operator can identify which build is running.
```

The individual scenarios remain unchanged — they test structural rendering mechanics that are unaffected by the version format change.

- [x]**Step 2: Run the BDD test to verify it still passes**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile version-display`
Expected: PASS — scenarios test structural properties, not version format content.

- [x]**Step 3: Commit**

```bash
git add cli/features/version-display.feature
git commit -m "test(version-consolidation): update BDD feature description for plugin.json source"
```

---
