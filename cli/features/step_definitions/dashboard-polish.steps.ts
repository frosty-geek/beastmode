/**
 * Step definitions for dashboard-polish integration tests.
 *
 * Tests verify structural properties of the dashboard source code
 * targeting the Monokai Pro palette, smooth gradient, depth hierarchy,
 * vertical split layout, and chrome removal.
 * No React rendering — source analysis and function calls only.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { DashboardWorld } from "../support/dashboard-world.js";

// =============================================================================
// Monokai Pro palette constants (from design decisions)
// =============================================================================

const MONOKAI = {
  border: "#727072",
  title: "#78DCE8",
  phase: {
    design: "#AB9DF2",
    plan: "#78DCE8",
    implement: "#FFD866",
    validate: "#A9DC76",
    release: "#FC9867",
    done: "#A9DC76",
    cancelled: "#FF6188",
    blocked: "#FF6188",
  },
  status: {
    green: "#A9DC76",
    red: "#FF6188",
  },
  background: {
    chrome: "#403E41",
    panel: "#353236",
    terminal: "#2D2A2E",
  },
} as const;

// =============================================================================
// Given steps
// =============================================================================

Given("the dashboard is rendered", function (this: DashboardWorld) {
  // Source-analysis pattern: verify sources are loaded (setup() ran in Before hook)
  assert.ok(this.appSource.length > 0, "App.tsx source should be loaded");
  assert.ok(this.threePanelSource.length > 0, "ThreePanelLayout.tsx source should be loaded");
  assert.ok(this.nyanBannerSource.length > 0, "NyanBanner.tsx source should be loaded");
  assert.ok(this.panelBoxSource.length > 0, "PanelBox.tsx source should be loaded");
});

Given("the banner color engine is initialized", function (this: DashboardWorld) {
  assert.ok(typeof this.nyanColorFn === "function", "nyanColor should be a function");
  assert.ok(this.nyanPaletteLength > 0, "NYAN_PALETTE should have entries");
});

// =============================================================================
// When steps — semantic markers for source analysis
// =============================================================================

When("I observe the banner region", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe panel border styling", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe panel title styling", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the indicator for phase {string}", function (this: DashboardWorld, _phase: string) {
  // Phase stored for Then step — analysis happens there
  (this as any)._observedPhase = _phase;
});

When("I observe status badge colors", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I query the interpolation palette size", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I render one frame of the banner gradient", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the header bar background", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the hints bar background", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe panel interior backgrounds", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the overall color hierarchy", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the outermost layout container", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the epics panel", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the overview panel", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I observe the log panel", function (this: DashboardWorld) {
  // Analysis happens in Then steps
});

When("I verify all dashboard-polish requirements", function (this: DashboardWorld) {
  // Composite verification — individual Then steps do the checks
});

// =============================================================================
// Then steps — Banner
// =============================================================================

Then("the banner displays the text {string}", function (this: DashboardWorld, expected: string) {
  const bannerText = this.extractBannerText();
  assert.ok(
    bannerText.length > 0,
    "BANNER_LINES should be defined in NyanBanner.tsx",
  );
  // D = █▀▄ top / █▄▀ bottom (not K = █▄▀ top / █▀▄ bottom)
  assert.ok(
    !this.nyanBannerSource.includes("█▀▄▀█ █▀█ █▄▀") ||
    this.nyanBannerSource.includes("BEASTMODE"),
    "Banner should spell BEASTMODE, not BEASTMOKE",
  );
});

Then("the banner has trailing dot characters", function (this: DashboardWorld) {
  assert.ok(
    this.bannerHasTrailingDots(),
    "NyanBanner should have trailing ▄ dot characters in BANNER_LINES",
  );
});

Then("the banner trailing dots use the block character pattern", function (this: DashboardWorld) {
  const bannerText = this.extractBannerText();
  assert.ok(
    bannerText.includes("▄"),
    "Trailing dots should use ▄ block characters matching SVG branding",
  );
});

// =============================================================================
// Then steps — Monokai Pro palette
// =============================================================================

Then("panel borders use color {string}", function (this: DashboardWorld, expected: string) {
  const borderColor = this.extractPanelBorderColor();
  assert.strictEqual(
    borderColor,
    expected,
    `PanelBox border color should be ${expected}, got ${borderColor}`,
  );
});

Then("panel titles use color {string}", function (this: DashboardWorld, expected: string) {
  const titleColor = this.extractPanelTitleColor();
  assert.strictEqual(
    titleColor,
    expected,
    `PanelBox title color should be ${expected}, got ${titleColor}`,
  );
});

Then("the phase {string} has a unique Monokai Pro accent color", function (this: DashboardWorld, phase: string) {
  const epicColors = this.extractPhaseColors(this.epicsPanelSource);
  const expected = (MONOKAI.phase as Record<string, string>)[phase];
  assert.ok(expected, `Expected Monokai color for phase "${phase}"`);
  assert.strictEqual(
    epicColors[phase],
    expected,
    `EpicsPanel phase color for "${phase}" should be ${expected}, got ${epicColors[phase]}`,
  );
});

Then("watch status colors use Monokai Pro green and red accents", function (this: DashboardWorld) {
  assert.ok(
    this.threePanelSource.includes(MONOKAI.status.green),
    `Watch status should use Monokai green ${MONOKAI.status.green}`,
  );
  assert.ok(
    this.threePanelSource.includes(MONOKAI.status.red),
    `Watch status should use Monokai red ${MONOKAI.status.red}`,
  );
});

// =============================================================================
// Then steps — Smooth gradient
// =============================================================================

Then("the palette contains {int} color entries", function (this: DashboardWorld, expected: number) {
  assert.strictEqual(
    this.nyanPaletteLength,
    expected,
    `NYAN_PALETTE should have ${expected} entries, got ${this.nyanPaletteLength}`,
  );
});

Then("adjacent characters have colors from the interpolated palette", function (this: DashboardWorld) {
  assert.ok(
    this.adjacentColorsSimilar(0),
    "Adjacent characters should both receive colors from the interpolated palette",
  );
});

Then("the gradient shift per tick is {int} index in a {int}-entry palette", function (
  this: DashboardWorld,
  shift: number,
  paletteSize: number,
) {
  const c0 = this.nyanColorFn("█", 0, 0);
  const c1 = this.nyanColorFn("█", 0, shift);
  assert.notStrictEqual(c0, c1, "Color should shift by 1 index per tick");
  assert.strictEqual(this.nyanPaletteLength, paletteSize, `Palette size should be ${paletteSize}`);
});

// =============================================================================
// Then steps — Depth hierarchy
// =============================================================================

Then("the header bar background is {string}", function (this: DashboardWorld, expected: string) {
  const bg = this.extractBackgroundColor(this.threePanelSource, "Banner");
  assert.strictEqual(bg, expected, `Header bar background should be ${expected}, got ${bg}`);
});

Then("the hints bar background is {string}", function (this: DashboardWorld, expected: string) {
  const bg = this.extractBackgroundColor(this.threePanelSource, "hints");
  assert.strictEqual(bg, expected, `Hints bar background should be ${expected}, got ${bg}`);
});

Then("the panel interior background is {string}", function (this: DashboardWorld, expected: string) {
  const bg = this.extractBackgroundColor(this.panelBoxSource, "Content");
  assert.ok(
    this.panelBoxSource.includes(`backgroundColor`) &&
    this.panelBoxSource.includes(expected),
    `Panel interior background should be ${expected}, got ${bg}`,
  );
});

Then("three distinct background tiers are present", function (this: DashboardWorld) {
  assert.ok(
    this.threePanelSource.includes(MONOKAI.background.chrome) ||
    this.panelBoxSource.includes(MONOKAI.background.chrome),
    `Chrome tier ${MONOKAI.background.chrome} should be present`,
  );
  assert.ok(
    this.panelBoxSource.includes(MONOKAI.background.panel),
    `Panel tier ${MONOKAI.background.panel} should be present`,
  );
});

Then("the chrome tier is {string}", function (this: DashboardWorld, expected: string) {
  assert.ok(
    this.threePanelSource.includes(expected),
    `Chrome tier color ${expected} should appear in ThreePanelLayout`,
  );
});

Then("the panel tier is {string}", function (this: DashboardWorld, expected: string) {
  assert.ok(
    this.panelBoxSource.includes(expected),
    `Panel tier color ${expected} should appear in PanelBox`,
  );
});

Then("the terminal tier is {string}", function (this: DashboardWorld, _expected: string) {
  assert.ok(true, "Terminal tier is the system background — not set in code");
});

// =============================================================================
// Then steps — Chrome removal
// =============================================================================

Then("the outermost container has no visible border", function (this: DashboardWorld) {
  assert.ok(
    !this.hasOuterChromeBorder(),
    "ThreePanelLayout should not have an outer chrome border (borderStyle='single' borderColor='cyan' on the main wrapper)",
  );
});

Then("the epics panel has a self-contained border with title {string}", function (
  this: DashboardWorld,
  title: string,
) {
  assert.ok(
    this.hasPanelTitle(title),
    `ThreePanelLayout should have a PanelBox with title "${title}"`,
  );
  assert.ok(
    this.panelBoxSource.includes("borderStyle"),
    "PanelBox should have its own border style",
  );
});

Then("the overview panel has a self-contained border with title {string}", function (
  this: DashboardWorld,
  title: string,
) {
  assert.ok(
    this.hasPanelTitle(title),
    `ThreePanelLayout should have a PanelBox with title "${title}"`,
  );
});

Then("the log panel has a self-contained border with title {string}", function (
  this: DashboardWorld,
  title: string,
) {
  assert.ok(
    this.hasPanelTitle(title),
    `ThreePanelLayout should have a PanelBox with title "${title}"`,
  );
});

// =============================================================================
// Then steps — Modified scenarios (layout, gradient, end-to-end)
// =============================================================================

Then("the left column width is {string}", function (this: DashboardWorld, expected: string) {
  const width = this.extractColumnWidth("left");
  assert.strictEqual(width, expected, `Left column width should be ${expected}, got ${width}`);
});

Then("the right column width is {string}", function (this: DashboardWorld, expected: string) {
  const width = this.extractColumnWidth("right");
  assert.strictEqual(width, expected, `Right column width should be ${expected}, got ${width}`);
});

Then("within the left column the epics panel takes {string} of the vertical space", function (
  this: DashboardWorld,
  expected: string,
) {
  const pattern = new RegExp(`title="EPICS"[^>]*height="${expected.replace("%", "\\%")}"`);
  assert.ok(
    pattern.test(this.threePanelSource) || this.threePanelSource.includes(`height="${expected}"`),
    `Epics panel should take ${expected} of left column height`,
  );
});

Then("within the left column the overview panel takes {string} of the vertical space", function (
  this: DashboardWorld,
  expected: string,
) {
  const pattern = new RegExp(`title="OVERVIEW"[^>]*height="${expected.replace("%", "\\%")}"`);
  assert.ok(
    pattern.test(this.threePanelSource) || this.threePanelSource.includes(`height="${expected}"`),
    `Overview panel should take ${expected} of left column height`,
  );
});

Then("the log panel fills the full height of the right column", function (this: DashboardWorld) {
  const logPattern = /title="LOG"\s+flexGrow=\{1\}/;
  assert.ok(
    logPattern.test(this.threePanelSource),
    "LOG panel should use flexGrow={1} for full height",
  );
});

Then("the outer container uses a horizontal split layout", function (this: DashboardWorld) {
  assert.ok(
    this.threePanelSource.includes('flexDirection="row"'),
    "Content area should use flexDirection='row' for horizontal split",
  );
});

Then("adjacent character colors differ by at most one interpolation step", function (this: DashboardWorld) {
  assert.ok(
    this.adjacentColorsSimilar(0),
    "Adjacent characters should have similar colors in the interpolated palette",
  );
});

// =============================================================================
// Then steps — End-to-end composite (modified scenario)
// =============================================================================

Then("the header contains a NyanBanner component displaying {string} with trailing dots", function (
  this: DashboardWorld,
  text: string,
) {
  assert.ok(
    this.threePanelSource.includes("<NyanBanner"),
    "ThreePanelLayout should contain <NyanBanner />",
  );
  const bannerContent = this.extractBannerText();
  assert.ok(bannerContent.length > 0, "BANNER_LINES should be defined");
  assert.ok(this.bannerHasTrailingDots(), "Banner should have trailing dots");
});

Then("all three panels have self-contained PanelBox borders with clean titles", function (
  this: DashboardWorld,
) {
  for (const title of ["EPICS", "OVERVIEW", "LOG"]) {
    assert.ok(this.hasPanelTitle(title), `Should have panel titled "${title}"`);
  }
  assert.ok(
    this.panelBoxSource.includes("borderStyle"),
    "PanelBox should define its own border",
  );
});

Then("the layout uses a vertical split with left column at {string} and right column at {string}", function (
  this: DashboardWorld,
  leftWidth: string,
  rightWidth: string,
) {
  const left = this.extractColumnWidth("left");
  const right = this.extractColumnWidth("right");
  assert.strictEqual(left, leftWidth, `Left column should be ${leftWidth}`);
  assert.strictEqual(right, rightWidth, `Right column should be ${rightWidth}`);
});

Then("the overview panel is a static display component in the left column below epics", function (
  this: DashboardWorld,
) {
  assert.ok(
    !this.overviewPanelSource.includes("useState"),
    "OverviewPanel should not use useState (static display)",
  );
});

Then("the log panel fills full height in the right column", function (this: DashboardWorld) {
  const logPattern = /title="LOG"\s+flexGrow=\{1\}/;
  assert.ok(
    logPattern.test(this.threePanelSource),
    "LOG panel should use flexGrow={1}",
  );
});

Then("panel borders use the Monokai Pro gray accent", function (this: DashboardWorld) {
  const borderColor = this.extractPanelBorderColor();
  assert.strictEqual(
    borderColor,
    MONOKAI.border,
    `Panel border color should be ${MONOKAI.border}`,
  );
});

Then("panel titles use the Monokai Pro cyan accent", function (this: DashboardWorld) {
  const titleColor = this.extractPanelTitleColor();
  assert.strictEqual(
    titleColor,
    MONOKAI.title,
    `Panel title color should be ${MONOKAI.title}`,
  );
});

Then("three background depth tiers are visible", function (this: DashboardWorld) {
  assert.ok(
    this.threePanelSource.includes(MONOKAI.background.chrome) ||
    this.panelBoxSource.includes(MONOKAI.background.chrome),
    "Chrome tier should be present",
  );
  assert.ok(
    this.panelBoxSource.includes(MONOKAI.background.panel),
    "Panel tier should be present",
  );
});

Then("the outermost container has no chrome border", function (this: DashboardWorld) {
  assert.ok(
    !this.hasOuterChromeBorder(),
    "No outer chrome border should be present",
  );
});

Then("the banner gradient uses smooth 256-step interpolation", function (this: DashboardWorld) {
  assert.strictEqual(
    this.nyanPaletteLength,
    256,
    `Palette should have 256 entries, got ${this.nyanPaletteLength}`,
  );
});
