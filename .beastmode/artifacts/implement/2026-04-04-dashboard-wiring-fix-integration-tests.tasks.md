# Integration Tests — Dashboard Wiring Fix

## Goal

Implement BDD integration scenarios verifying that App.tsx renders ThreePanelLayout with all five flashy-dashboard requirements: rainbow nyan banner, 80ms tick animation, inline panel titles (EPICS, OVERVIEW, LOG), static overview panel, and full terminal height.

## Architecture

- **BDD Framework:** Cucumber.js with Gherkin `.feature` files
- **Test World:** Custom `DashboardWorld` class — no real React rendering, pure logic/structural verification against source code and runtime constants
- **Pattern:** Follow existing watch-loop/pipeline cucumber patterns — World class, hooks, step definitions, cucumber.json profile
- **Mock Boundary:** No component rendering. Tests verify structural properties: imports in App.tsx, JSX elements, prop wiring, constant values, layout percentages

## Tech Stack

- `@cucumber/cucumber` ^12.7.0 (already installed)
- `bun:test` for assertion-compatible patterns
- `node:assert` strict mode (cucumber convention)
- TypeScript step definitions

## File Structure

| File | Responsibility |
|------|---------------|
| `cli/features/dashboard-wiring-fix.feature` | Create: Gherkin scenarios from integration artifact |
| `cli/features/step_definitions/dashboard-wiring.steps.ts` | Create: Step definitions with structural verification |
| `cli/features/support/dashboard-world.ts` | Create: World class that reads/parses source files |
| `cli/features/support/dashboard-hooks.ts` | Create: Before/After lifecycle hooks |
| `cli/cucumber.json` | Modify: Add `dashboard` profile |

---

### Task 0: Create Dashboard World Class

**Wave:** 1
**Depends on:** -

The world class reads actual source files (App.tsx, ThreePanelLayout.tsx, NyanBanner.tsx, nyan-colors.ts, PanelBox.tsx, OverviewPanel.tsx) at test time and exposes parsed properties for step definitions to assert against.

**Files:**
- Create: `cli/features/support/dashboard-world.ts`
- Create: `cli/features/support/dashboard-hooks.ts`

- [ ] **Step 1: Write the Dashboard World class**

```typescript
// cli/features/support/dashboard-world.ts
/**
 * Cucumber World for dashboard wiring integration tests.
 *
 * Reads actual source files and exposes structural/behavioral
 * properties for step definitions to assert against.
 * No React rendering — pure source analysis and constant evaluation.
 */

import { World, setWorldConstructor } from "@cucumber/cucumber";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CLI_SRC = resolve(import.meta.dirname, "../../src");

export class DashboardWorld extends World {
  /** Raw source of App.tsx */
  appSource = "";
  /** Raw source of ThreePanelLayout.tsx */
  threePanelSource = "";
  /** Raw source of NyanBanner.tsx */
  nyanBannerSource = "";
  /** Raw source of nyan-colors.ts */
  nyanColorsSource = "";
  /** Raw source of PanelBox.tsx */
  panelBoxSource = "";
  /** Raw source of OverviewPanel.tsx */
  overviewPanelSource = "";

  /** NYAN_PALETTE imported at runtime */
  nyanPalette: string[] = [];
  /** nyanColor function imported at runtime */
  nyanColorFn!: (char: string, charIndex: number, tickOffset: number) => string | undefined;
  /** TICK_INTERVAL_MS from NyanBanner */
  tickIntervalMs = 0;

  setup(): void {
    this.appSource = readFileSync(resolve(CLI_SRC, "dashboard/App.tsx"), "utf-8");
    this.threePanelSource = readFileSync(resolve(CLI_SRC, "dashboard/ThreePanelLayout.tsx"), "utf-8");
    this.nyanBannerSource = readFileSync(resolve(CLI_SRC, "dashboard/NyanBanner.tsx"), "utf-8");
    this.nyanColorsSource = readFileSync(resolve(CLI_SRC, "dashboard/nyan-colors.ts"), "utf-8");
    this.panelBoxSource = readFileSync(resolve(CLI_SRC, "dashboard/PanelBox.tsx"), "utf-8");
    this.overviewPanelSource = readFileSync(resolve(CLI_SRC, "dashboard/OverviewPanel.tsx"), "utf-8");
  }

  async loadRuntime(): Promise<void> {
    const colors = await import("../../src/dashboard/nyan-colors.js");
    this.nyanPalette = [...colors.NYAN_PALETTE];
    this.nyanColorFn = colors.nyanColor;

    // Extract TICK_INTERVAL_MS from NyanBanner source
    const tickMatch = this.nyanBannerSource.match(/TICK_INTERVAL_MS\s*=\s*(\d+)/);
    this.tickIntervalMs = tickMatch ? parseInt(tickMatch[1], 10) : 0;
  }

  /** Check if App.tsx imports a specific module name */
  appImports(moduleName: string): boolean {
    return this.appSource.includes(`from "./${moduleName}`) ||
           this.appSource.includes(`from './${moduleName}`);
  }

  /** Check if App.tsx JSX contains a component tag */
  appRendersComponent(componentName: string): boolean {
    const tagPattern = new RegExp(`<${componentName}[\\s/>]`);
    return tagPattern.test(this.appSource);
  }

  /** Extract height="XX%" from ThreePanelLayout source for a section */
  extractHeight(sectionComment: string): string | null {
    const idx = this.threePanelSource.indexOf(sectionComment);
    if (idx === -1) return null;
    const after = this.threePanelSource.slice(idx, idx + 300);
    const match = after.match(/height="(\d+%)"/);
    return match ? match[1] : null;
  }

  /** Extract width="XX%" for a panel by title */
  extractPanelWidth(panelTitle: string): string | null {
    const pattern = new RegExp(`title="${panelTitle}"\\s+width="(\\d+%)"`);
    const match = this.threePanelSource.match(pattern);
    return match ? match[1] : null;
  }

  /** Check if a panel title exists in ThreePanelLayout */
  hasPanelTitle(title: string): boolean {
    return this.threePanelSource.includes(`title="${title}"`);
  }

  /** Extract clock interval from App.tsx */
  extractClockInterval(): number {
    const match = this.appSource.match(/setInterval\(\s*\(\)\s*=>\s*setClock\(formatClock\(\)\)\s*,\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Check if formatClock produces HH:MM:SS */
  hasHHMMSSFormat(): boolean {
    return this.appSource.includes('padStart(2, "0")') && this.appSource.includes('.join(":")');
  }
}

setWorldConstructor(DashboardWorld);
```

- [ ] **Step 2: Write the lifecycle hooks**

```typescript
// cli/features/support/dashboard-hooks.ts
/**
 * Cucumber lifecycle hooks for dashboard wiring integration tests.
 */

import { Before, After } from "@cucumber/cucumber";
import type { DashboardWorld } from "./dashboard-world.js";

Before(async function (this: DashboardWorld) {
  this.setup();
  await this.loadRuntime();
});

After(async function (this: DashboardWorld) {
  // No teardown needed — read-only tests
});
```

- [ ] **Step 3: Verify files compile**

Run: `cd cli && bun build features/support/dashboard-world.ts --outdir /tmp/bm-check --target bun 2>&1`
Expected: Build succeeds (exit code 0)

- [ ] **Step 4: Commit**

```bash
git add cli/features/support/dashboard-world.ts cli/features/support/dashboard-hooks.ts
git commit -m "feat(integration-tests): add DashboardWorld and hooks"
```

---

### Task 1: Create Feature File

**Wave:** 1
**Depends on:** -

Write the Gherkin `.feature` file with all scenarios from the integration artifact.

**Files:**
- Create: `cli/features/dashboard-wiring-fix.feature`

- [ ] **Step 1: Write the feature file**

```gherkin
@dashboard-wiring-fix
Feature: Dashboard wiring — ThreePanelLayout replaces TwoColumnLayout

  App.tsx must render ThreePanelLayout (not TwoColumnLayout) with nyan cat
  rainbow banner, inline panel titles, static overview panel, correct
  proportions, and full terminal height.

  # --- App root renders ThreePanelLayout ---

  Scenario: App renders ThreePanelLayout instead of TwoColumnLayout
    Given the App component source is loaded
    When I check the top-level layout component
    Then App renders ThreePanelLayout as the top-level layout
    And App does not render TwoColumnLayout

  # --- Rainbow nyan banner ---

  Scenario: Nyan banner renders in header
    Given the ThreePanelLayout source is loaded
    When I check the header section
    Then the header contains a NyanBanner component

  Scenario: Rainbow banner cycles through animation frames
    Given the nyan color runtime is loaded
    When the tick offset advances by 1
    Then the color assigned to charIndex 0 changes

  # --- Three-panel layout proportions ---

  Scenario: Layout has epics, overview, and log panels with correct proportions
    Given the ThreePanelLayout source is loaded
    When I check panel dimensions
    Then the top section height is "35%"
    And the epics panel width is "30%"
    And the overview panel width is "70%"
    And the log panel uses flexGrow

  # --- Inline panel titles ---

  Scenario: Each panel has an inline title
    Given the ThreePanelLayout source is loaded
    When I check panel titles
    Then the epics panel has title "EPICS"
    And the overview panel has title "OVERVIEW"
    And the log panel has title "LOG"

  # --- Static overview panel ---

  Scenario: Overview panel displays pipeline state
    Given the OverviewPanel source is loaded
    When I check the overview panel content
    Then the overview panel shows "Phase Distribution"
    And the overview panel shows "Sessions"
    And the overview panel shows "Git"

  # --- Full terminal height ---

  Scenario: Log panel renders at full terminal height below top section
    Given the ThreePanelLayout source is loaded
    When I check the log panel
    Then the log panel uses flexGrow for remaining vertical space
    And the outer container uses rows prop for height

  # --- Clock and tick rate ---

  Scenario: Clock updates every 1 second
    Given the App component source is loaded
    When I check the clock effect
    Then the clock interval is 1000 milliseconds
    And the clock format is HH:MM:SS

  Scenario: Dashboard ticks at 80ms intervals
    Given the NyanBanner source is loaded
    When I check the tick interval
    Then the tick interval is 80 milliseconds

  # --- End-to-end verification ---

  Scenario: All flashy-dashboard requirements work together
    Given the App component source is loaded
    And the ThreePanelLayout source is loaded
    And the nyan color runtime is loaded
    When I verify all five flashy-dashboard requirements
    Then App renders ThreePanelLayout as the top-level layout
    And the header contains a NyanBanner component
    And all three panels have inline titles
    And the overview panel is a static display component
    And the log panel uses flexGrow for remaining vertical space
    And the tick interval is 80 milliseconds
```

- [ ] **Step 2: Commit**

```bash
git add cli/features/dashboard-wiring-fix.feature
git commit -m "feat(integration-tests): add dashboard wiring Gherkin scenarios"
```

---

### Task 2: Create Step Definitions

**Wave:** 2
**Depends on:** Task 0, Task 1

Write the step definition file that implements all Given/When/Then steps using the DashboardWorld.

**Files:**
- Create: `cli/features/step_definitions/dashboard-wiring.steps.ts`

- [ ] **Step 1: Write the step definitions**

```typescript
// cli/features/step_definitions/dashboard-wiring.steps.ts
/**
 * Step definitions for dashboard wiring integration tests.
 *
 * Tests verify structural properties of the dashboard source code
 * and runtime behavior of pure functions (nyanColor, constants).
 * No React rendering — source analysis and function calls only.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { DashboardWorld } from "../support/dashboard-world.js";

// =============================================================================
// Given steps
// =============================================================================

Given("the App component source is loaded", function (this: DashboardWorld) {
  assert.ok(this.appSource.length > 0, "App.tsx source should be loaded");
});

Given("the ThreePanelLayout source is loaded", function (this: DashboardWorld) {
  assert.ok(this.threePanelSource.length > 0, "ThreePanelLayout.tsx source should be loaded");
});

Given("the nyan color runtime is loaded", function (this: DashboardWorld) {
  assert.ok(this.nyanPalette.length === 6, "NYAN_PALETTE should have 6 colors");
  assert.ok(typeof this.nyanColorFn === "function", "nyanColor should be a function");
});

Given("the NyanBanner source is loaded", function (this: DashboardWorld) {
  assert.ok(this.nyanBannerSource.length > 0, "NyanBanner.tsx source should be loaded");
});

Given("the OverviewPanel source is loaded", function (this: DashboardWorld) {
  assert.ok(this.overviewPanelSource.length > 0, "OverviewPanel.tsx source should be loaded");
});

Given("the App component is initialized with config", function (this: DashboardWorld) {
  // App source already loaded in Before hook — verify it exports the component
  assert.ok(
    this.appSource.includes("export default function App"),
    "App.tsx should export default function App",
  );
});

// =============================================================================
// When steps
// =============================================================================

When("I check the top-level layout component", function (this: DashboardWorld) {
  // Analysis happens in Then steps — this is a semantic marker
});

When("I check the header section", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("the tick offset advances by 1", function (this: DashboardWorld) {
  // Store colors at tick 0 and tick 1 for comparison
  (this as any)._colorAtTick0 = this.nyanColorFn("█", 0, 0);
  (this as any)._colorAtTick1 = this.nyanColorFn("█", 0, 1);
});

When("I check panel dimensions", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I check panel titles", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I check the overview panel content", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I check the log panel", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I check the clock effect", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I check the tick interval", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I verify all five flashy-dashboard requirements", function (this: DashboardWorld) {
  // Composite verification — individual Then steps do the checks
});

// =============================================================================
// Then steps
// =============================================================================

// --- App root layout ---

Then("App renders ThreePanelLayout as the top-level layout", function (this: DashboardWorld) {
  assert.ok(
    this.appRendersComponent("ThreePanelLayout"),
    "App.tsx should render <ThreePanelLayout> in its JSX",
  );
});

Then("App does not render TwoColumnLayout", function (this: DashboardWorld) {
  assert.ok(
    !this.appRendersComponent("TwoColumnLayout"),
    "App.tsx should NOT render <TwoColumnLayout> in its JSX",
  );
});

// --- Nyan banner ---

Then("the header contains a NyanBanner component", function (this: DashboardWorld) {
  assert.ok(
    this.threePanelSource.includes("<NyanBanner"),
    "ThreePanelLayout should contain <NyanBanner /> in the header",
  );
});

Then("the color assigned to charIndex 0 changes", function (this: DashboardWorld) {
  const c0 = (this as any)._colorAtTick0 as string;
  const c1 = (this as any)._colorAtTick1 as string;
  assert.notStrictEqual(
    c0,
    c1,
    `nyanColor("█", 0, 0)=${c0} should differ from nyanColor("█", 0, 1)=${c1}`,
  );
});

// --- Layout proportions ---

Then("the top section height is {string}", function (this: DashboardWorld, expected: string) {
  const height = this.extractHeight("Top section");
  assert.strictEqual(height, expected, `Top section height should be ${expected}, got ${height}`);
});

Then("the epics panel width is {string}", function (this: DashboardWorld, expected: string) {
  const width = this.extractPanelWidth("EPICS");
  assert.strictEqual(width, expected, `EPICS panel width should be ${expected}, got ${width}`);
});

Then("the overview panel width is {string}", function (this: DashboardWorld, expected: string) {
  const width = this.extractPanelWidth("OVERVIEW");
  assert.strictEqual(width, expected, `OVERVIEW panel width should be ${expected}, got ${width}`);
});

Then("the log panel uses flexGrow", function (this: DashboardWorld) {
  // LOG panel uses flexGrow={1} instead of a percentage height
  const logPattern = /title="LOG"\s+flexGrow=\{1\}/;
  assert.ok(
    logPattern.test(this.threePanelSource),
    "LOG panel should use flexGrow={1}",
  );
});

// --- Inline panel titles ---

Then("the epics panel has title {string}", function (this: DashboardWorld, title: string) {
  assert.ok(this.hasPanelTitle(title), `ThreePanelLayout should have panel titled "${title}"`);
});

Then("the overview panel has title {string}", function (this: DashboardWorld, title: string) {
  assert.ok(this.hasPanelTitle(title), `ThreePanelLayout should have panel titled "${title}"`);
});

Then("the log panel has title {string}", function (this: DashboardWorld, title: string) {
  assert.ok(this.hasPanelTitle(title), `ThreePanelLayout should have panel titled "${title}"`);
});

// --- Overview panel ---

Then("the overview panel shows {string}", function (this: DashboardWorld, text: string) {
  assert.ok(
    this.overviewPanelSource.includes(text),
    `OverviewPanel should contain "${text}"`,
  );
});

// --- Full terminal height ---

Then("the log panel uses flexGrow for remaining vertical space", function (this: DashboardWorld) {
  const logPattern = /title="LOG"\s+flexGrow=\{1\}/;
  assert.ok(
    logPattern.test(this.threePanelSource),
    "LOG panel should use flexGrow={1} for remaining vertical space",
  );
});

Then("the outer container uses rows prop for height", function (this: DashboardWorld) {
  assert.ok(
    this.threePanelSource.includes("height={rows"),
    "Outer container should use rows prop for height",
  );
});

// --- Clock and tick ---

Then("the clock interval is {int} milliseconds", function (this: DashboardWorld, expected: number) {
  const interval = this.extractClockInterval();
  assert.strictEqual(interval, expected, `Clock interval should be ${expected}ms, got ${interval}ms`);
});

Then("the clock format is HH:MM:SS", function (this: DashboardWorld) {
  assert.ok(this.hasHHMMSSFormat(), "formatClock should produce HH:MM:SS format");
});

Then("the tick interval is {int} milliseconds", function (this: DashboardWorld, expected: number) {
  assert.strictEqual(
    this.tickIntervalMs,
    expected,
    `TICK_INTERVAL_MS should be ${expected}, got ${this.tickIntervalMs}`,
  );
});

// --- End-to-end composite ---

Then("all three panels have inline titles", function (this: DashboardWorld) {
  for (const title of ["EPICS", "OVERVIEW", "LOG"]) {
    assert.ok(this.hasPanelTitle(title), `ThreePanelLayout should have panel titled "${title}"`);
  }
});

Then("the overview panel is a static display component", function (this: DashboardWorld) {
  // OverviewPanel receives props and displays them — no internal state management hooks
  assert.ok(
    !this.overviewPanelSource.includes("useState"),
    "OverviewPanel should not use useState (static display)",
  );
  assert.ok(
    this.overviewPanelSource.includes("export default function OverviewPanel"),
    "OverviewPanel should be a function component",
  );
});
```

- [ ] **Step 2: Verify step definitions compile**

Run: `cd cli && bun build features/step_definitions/dashboard-wiring.steps.ts --outdir /tmp/bm-check --target bun 2>&1`
Expected: Build succeeds (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add cli/features/step_definitions/dashboard-wiring.steps.ts
git commit -m "feat(integration-tests): add dashboard wiring step definitions"
```

---

### Task 3: Wire Cucumber Profile and Run Tests

**Wave:** 3
**Depends on:** Task 0, Task 1, Task 2

Add the `dashboard` profile to `cucumber.json` and run all scenarios.

**Files:**
- Modify: `cli/cucumber.json`

- [ ] **Step 1: Add dashboard profile to cucumber.json**

Add a `"dashboard"` profile entry to `cli/cucumber.json`:

```json
"dashboard": {
  "paths": ["features/dashboard-wiring-fix.feature"],
  "import": [
    "features/step_definitions/dashboard-wiring.steps.ts",
    "features/support/dashboard-world.ts",
    "features/support/dashboard-hooks.ts"
  ],
  "format": ["progress-bar"],
  "publishQuiet": true
}
```

Also add the dashboard feature to a `"dashboard-all"` key alongside the existing watch-all and pipeline-all patterns (optional — depends on project convention).

- [ ] **Step 2: Run the dashboard integration tests**

Run: `cd cli && bun --bun node_modules/.bin/cucumber-js --profile dashboard`
Expected: All 10 scenarios pass (green)

- [ ] **Step 3: Fix any failing scenarios**

If any scenarios fail, identify the root cause (step definition bug, world method bug, or source code mismatch) and fix.

- [ ] **Step 4: Commit**

```bash
git add cli/cucumber.json
git commit -m "feat(integration-tests): add dashboard cucumber profile and wire tests"
```
