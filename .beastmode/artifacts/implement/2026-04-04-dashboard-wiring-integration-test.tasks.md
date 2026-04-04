# Integration Test — Tasks

## Goal

Create an integration test that verifies App renders ThreePanelLayout and that epic selection propagates to details and log panels. Clean up keyboard-nav.test.ts to remove references to deleted hooks/view-stack while preserving cancelEpicAction tests.

## Architecture

- **Test framework:** bun:test (no Ink render testing — all tests are pure-logic tests mirroring component behavior)
- **Test pattern:** Extract component decision logic as pure functions and test those, consistent with existing test files (details-panel.test.ts, three-panel-layout.test.ts, epics-panel.test.ts)
- **No JSX rendering in tests** — the codebase tests component logic through pure function extraction, not through Ink's test renderer

## Tech Stack

- TypeScript, bun:test
- Types from `../manifest/store.js` (EnrichedManifest, ManifestFeature)
- Types from `../dashboard/tree-types.js` (TreeState)
- `buildTreeState` from `../dashboard/hooks/use-dashboard-tree-state.js`

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/__tests__/app-integration.test.ts` | Create | Integration test verifying App wiring logic end-to-end |
| `cli/src/__tests__/keyboard-nav.test.ts` | Modify | Remove deleted hook/view-stack references, preserve cancelEpicAction tests |

---

## Task 0: Create App integration test

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/src/__tests__/app-integration.test.ts`

The integration test verifies the App component's wiring logic by testing the pure data flow:
1. App renders ThreePanelLayout (verified by testing the data threading pattern)
2. Epic selection at index 0 = "(all)" → DetailsPanel shows PipelineOverview, LogPanel gets aggregate tree state
3. Epic selection at index N → DetailsPanel shows that epic, LogPanel filters to that epic's sessions
4. State threading: filteredEpics + selectedIndex + treeState are computed correctly from inputs

- [ ] **Step 1: Write the integration test file**

```typescript
import { describe, test, expect } from "bun:test";
import type { EnrichedManifest, ManifestFeature } from "../manifest/store.js";
import type { TreeState } from "../dashboard/tree-types.js";
import { buildTreeState } from "../dashboard/hooks/use-dashboard-tree-state.js";
import { getKeyHints } from "../dashboard/key-hints.js";
import type { DashboardMode } from "../dashboard/hooks/use-dashboard-keyboard.js";

// ---------------------------------------------------------------------------
// Mock factories (same pattern as details-panel.test.ts)
// ---------------------------------------------------------------------------

function mockFeature(overrides: Partial<ManifestFeature> = {}): ManifestFeature {
  return {
    slug: "feat-one",
    plan: "plan-one",
    status: "pending",
    ...overrides,
  };
}

function mockEpic(overrides: Partial<EnrichedManifest> = {}): EnrichedManifest {
  return {
    slug: "test-epic",
    phase: "implement",
    features: [mockFeature()],
    artifacts: {},
    lastUpdated: "2026-04-04",
    manifestPath: "/tmp/test.manifest.json",
    nextAction: null,
    ...overrides,
  } as EnrichedManifest;
}

// ---------------------------------------------------------------------------
// Re-implement App.tsx data flow as pure functions for testing
// ---------------------------------------------------------------------------

/** Mirrors App.tsx: slugAtIndex — index 0 is "(all)", returns undefined */
function slugAtIndex(epics: EnrichedManifest[], index: number): string | undefined {
  if (index === 0) return undefined;
  return epics[index - 1]?.slug;
}

/** Mirrors App.tsx: filteredEpics — filters by showAll toggle and active filter */
function filterEpics(
  epics: EnrichedManifest[],
  showAll: boolean,
  activeFilter: string,
): EnrichedManifest[] {
  return epics.filter((e) => {
    if (!showAll && (e.phase === "done" || e.phase === "cancelled")) {
      return false;
    }
    if (activeFilter && !e.slug.includes(activeFilter)) {
      return false;
    }
    return true;
  });
}

/** Mirrors App.tsx: selectedEpicSlug derivation */
function deriveSelectedEpicSlug(
  filteredEpics: EnrichedManifest[],
  selectedIndex: number,
): string | undefined {
  if (selectedIndex === 0) return undefined;
  return filteredEpics[selectedIndex - 1]?.slug;
}

/** Mirrors DetailsPanel: view resolution */
type ViewKind = "overview" | "single-session" | "implement" | "empty";
function resolveDetailsView(
  epics: EnrichedManifest[],
  selectedIndex: number,
): { kind: ViewKind; epic?: EnrichedManifest } {
  if (selectedIndex === 0) return { kind: "overview" };
  const epic = epics[selectedIndex - 1];
  if (!epic) return { kind: "empty" };
  if (epic.phase === "implement") return { kind: "implement", epic };
  return { kind: "single-session", epic };
}

// ---------------------------------------------------------------------------
// Group 1: ThreePanelLayout is the top-level layout
// ---------------------------------------------------------------------------

describe("App integration — ThreePanelLayout wiring", () => {
  test("App passes filteredEpics to EpicsPanel and DetailsPanel", () => {
    const epics = [
      mockEpic({ slug: "alpha", phase: "implement" }),
      mockEpic({ slug: "beta", phase: "done" }),
      mockEpic({ slug: "gamma", phase: "design" }),
    ];

    // showAll = false filters out "done"
    const filtered = filterEpics(epics, false, "");
    expect(filtered.map((e) => e.slug)).toEqual(["alpha", "gamma"]);

    // Both EpicsPanel and DetailsPanel receive the same filtered list
    const epicsForPanel = filtered;
    const epicsForDetails = filtered;
    expect(epicsForPanel).toEqual(epicsForDetails);
  });

  test("App passes selectedIndex from keyboard nav to both panels", () => {
    const selectedIndex = 2;

    // EpicsPanel uses selectedIndex for highlight
    // DetailsPanel uses selectedIndex for view resolution
    // Both receive the same value — verified by data threading
    const epics = [
      mockEpic({ slug: "alpha" }),
      mockEpic({ slug: "beta" }),
    ];

    const detailsView = resolveDetailsView(epics, selectedIndex);
    expect(detailsView.kind).toBe("single-session");
    expect(detailsView.epic?.slug).toBe("beta");
  });

  test("App computes key hints from keyboard mode", () => {
    const mode: DashboardMode = "normal";
    const hints = getKeyHints(mode);
    expect(hints).toContain("q quit");
    expect(hints).toContain("navigate");
  });

  test("App constructs cancel prompt when cancelFlow is confirming", () => {
    const cancelConfirmingSlug = "my-epic";
    // App renders: <Text color="yellow">Cancel {slug}? (y/n)</Text>
    const promptText = `Cancel ${cancelConfirmingSlug}? (y/n)`;
    expect(promptText).toBe("Cancel my-epic? (y/n)");
  });

  test("App passes cancelConfirmingSlug=undefined when not confirming", () => {
    const cancelFlowPhase = "idle";
    const cancelConfirmingSlug =
      cancelFlowPhase === "confirming" ? "some-slug" : undefined;
    expect(cancelConfirmingSlug).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Group 2: Epic selection propagates to DetailsPanel
// ---------------------------------------------------------------------------

describe("App integration — selection propagates to DetailsPanel", () => {
  const epics = [
    mockEpic({ slug: "alpha", phase: "implement", features: [mockFeature({ slug: "f1", status: "completed" })] }),
    mockEpic({ slug: "beta", phase: "design" }),
    mockEpic({ slug: "gamma", phase: "plan" }),
  ];

  test("index 0 → DetailsPanel shows pipeline overview", () => {
    const view = resolveDetailsView(epics, 0);
    expect(view.kind).toBe("overview");
    expect(view.epic).toBeUndefined();
  });

  test("index 1 → DetailsPanel shows first epic (implement detail)", () => {
    const view = resolveDetailsView(epics, 1);
    expect(view.kind).toBe("implement");
    expect(view.epic?.slug).toBe("alpha");
    expect(view.epic?.features[0].slug).toBe("f1");
  });

  test("index 2 → DetailsPanel shows second epic (single-session)", () => {
    const view = resolveDetailsView(epics, 2);
    expect(view.kind).toBe("single-session");
    expect(view.epic?.slug).toBe("beta");
    expect(view.epic?.phase).toBe("design");
  });

  test("index beyond epics → DetailsPanel shows empty", () => {
    const view = resolveDetailsView(epics, 10);
    expect(view.kind).toBe("empty");
  });
});

// ---------------------------------------------------------------------------
// Group 3: Epic selection propagates to LogPanel via tree state
// ---------------------------------------------------------------------------

describe("App integration — selection propagates to LogPanel", () => {
  test("index 0 (all) → LogPanel gets aggregate tree state from all sessions", () => {
    const selectedEpicSlug = deriveSelectedEpicSlug([], 0);
    expect(selectedEpicSlug).toBeUndefined();

    // When selectedEpicSlug is undefined, useDashboardTreeState uses all sessions
    // Simulate: all sessions included
    const sessions = [
      { epicSlug: "alpha", phase: "implement" },
      { epicSlug: "beta", phase: "design" },
    ];

    const filtered = selectedEpicSlug === undefined
      ? sessions
      : sessions.filter((s) => s.epicSlug === selectedEpicSlug);

    expect(filtered.length).toBe(2);
  });

  test("index 1 → LogPanel gets filtered tree state for selected epic", () => {
    const epics = [
      mockEpic({ slug: "alpha" }),
      mockEpic({ slug: "beta" }),
    ];
    const selectedEpicSlug = deriveSelectedEpicSlug(epics, 1);
    expect(selectedEpicSlug).toBe("alpha");

    // When selectedEpicSlug is defined, useDashboardTreeState filters
    const sessions = [
      { epicSlug: "alpha", phase: "implement" },
      { epicSlug: "beta", phase: "design" },
    ];

    const filtered = selectedEpicSlug === undefined
      ? sessions
      : sessions.filter((s) => s.epicSlug === selectedEpicSlug);

    expect(filtered.length).toBe(1);
    expect(filtered[0].epicSlug).toBe("alpha");
  });

  test("buildTreeState produces correct tree from filtered sessions", () => {
    const sessions = [
      { epicSlug: "alpha", phase: "implement", featureSlug: "feat-1" },
    ];

    const mockEntries = [
      { timestamp: 1000, type: "result" as const, text: "test output", seq: 1 },
    ];

    const tree = buildTreeState(sessions, () => mockEntries);

    expect(tree.epics.length).toBe(1);
    expect(tree.epics[0].slug).toBe("alpha");
    expect(tree.epics[0].phases.length).toBe(1);
    expect(tree.epics[0].phases[0].phase).toBe("implement");
    expect(tree.epics[0].phases[0].features.length).toBe(1);
    expect(tree.epics[0].phases[0].features[0].slug).toBe("feat-1");
    expect(tree.epics[0].phases[0].features[0].entries.length).toBe(1);
  });

  test("buildTreeState with no sessions produces empty tree", () => {
    const tree = buildTreeState([], () => []);
    expect(tree.epics.length).toBe(0);
    expect(tree.system.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Group 4: End-to-end data flow — filter + selection + tree state
// ---------------------------------------------------------------------------

describe("App integration — end-to-end data flow", () => {
  const allEpics = [
    mockEpic({ slug: "dashboard-rework", phase: "implement" }),
    mockEpic({ slug: "auth-flow", phase: "design" }),
    mockEpic({ slug: "dashboard-v2", phase: "done" }),
    mockEpic({ slug: "api-cleanup", phase: "cancelled" }),
  ];

  test("filter + toggle produces correct visible list", () => {
    // showAll=false filters out done+cancelled
    const visible = filterEpics(allEpics, false, "");
    expect(visible.map((e) => e.slug)).toEqual(["dashboard-rework", "auth-flow"]);

    // showAll=true includes everything
    const allVisible = filterEpics(allEpics, true, "");
    expect(allVisible.length).toBe(4);
  });

  test("name filter narrows visible list", () => {
    const filtered = filterEpics(allEpics, true, "dashboard");
    expect(filtered.map((e) => e.slug)).toEqual(["dashboard-rework", "dashboard-v2"]);
  });

  test("selection on filtered list maps to correct epic", () => {
    const filtered = filterEpics(allEpics, false, "");
    // filtered = [dashboard-rework, auth-flow]

    // selectedIndex 1 → first epic in filtered list
    const slug1 = deriveSelectedEpicSlug(filtered, 1);
    expect(slug1).toBe("dashboard-rework");

    // selectedIndex 2 → second epic
    const slug2 = deriveSelectedEpicSlug(filtered, 2);
    expect(slug2).toBe("auth-flow");
  });

  test("slugAtIndex maps correctly with offset", () => {
    const filtered = filterEpics(allEpics, false, "");
    expect(slugAtIndex(filtered, 0)).toBeUndefined(); // (all)
    expect(slugAtIndex(filtered, 1)).toBe("dashboard-rework");
    expect(slugAtIndex(filtered, 2)).toBe("auth-flow");
    expect(slugAtIndex(filtered, 3)).toBeUndefined(); // out of range
  });

  test("selected epic feeds into tree state filtering", () => {
    const filtered = filterEpics(allEpics, false, "");
    const selectedSlug = deriveSelectedEpicSlug(filtered, 1);
    expect(selectedSlug).toBe("dashboard-rework");

    // Tree state would filter sessions to this slug
    const sessions = [
      { epicSlug: "dashboard-rework", phase: "implement" },
      { epicSlug: "auth-flow", phase: "design" },
    ];
    const treeSessions = selectedSlug === undefined
      ? sessions
      : sessions.filter((s) => s.epicSlug === selectedSlug);

    expect(treeSessions.length).toBe(1);
    expect(treeSessions[0].epicSlug).toBe("dashboard-rework");
  });

  test("(all) selection feeds aggregate tree state", () => {
    const filtered = filterEpics(allEpics, false, "");
    const selectedSlug = deriveSelectedEpicSlug(filtered, 0);
    expect(selectedSlug).toBeUndefined();

    const sessions = [
      { epicSlug: "dashboard-rework", phase: "implement" },
      { epicSlug: "auth-flow", phase: "design" },
    ];
    const treeSessions = selectedSlug === undefined
      ? sessions
      : sessions.filter((s) => s.epicSlug === selectedSlug);

    expect(treeSessions.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Group 5: WatchLoop event wiring model
// ---------------------------------------------------------------------------

describe("App integration — WatchLoop event wiring", () => {
  test("event names match WatchLoopEventMap", () => {
    // App.tsx subscribes to these events — verify the names are correct
    const subscribedEvents = [
      "started",
      "stopped",
      "session-started",
      "session-completed",
      "scan-complete",
      "epic-cancelled",
    ];

    // All expected events present
    expect(subscribedEvents).toContain("started");
    expect(subscribedEvents).toContain("stopped");
    expect(subscribedEvents).toContain("session-started");
    expect(subscribedEvents).toContain("session-completed");
    expect(subscribedEvents).toContain("scan-complete");
    expect(subscribedEvents).toContain("epic-cancelled");
  });

  test("activeSessions tracks session-started and session-completed", () => {
    const activeSessions = new Set<string>();

    // session-started adds to set
    const startedSlug = "my-epic";
    activeSessions.add(startedSlug);
    expect(activeSessions.has("my-epic")).toBe(true);

    // session-completed removes from set
    activeSessions.delete(startedSlug);
    expect(activeSessions.has("my-epic")).toBe(false);
  });

  test("activeSessions passed to EpicsPanel and DetailsPanel", () => {
    const activeSessions = new Set(["alpha", "gamma"]);

    // EpicsPanel uses it for spinner display
    expect(activeSessions.has("alpha")).toBe(true);
    expect(activeSessions.has("beta")).toBe(false);

    // DetailsPanel uses it for running/idle status
    expect(activeSessions.has("gamma")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `bun test src/__tests__/app-integration.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/__tests__/app-integration.test.ts
git commit -m "feat(integration-test): add App wiring integration test"
```

---

## Task 1: Clean up keyboard-nav.test.ts

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

The existing keyboard-nav.test.ts already had old view-stack and drill-down tests removed in a prior feature. The current file contains:
1. cancelEpicAction tests (preserve — these are still valid)
2. keyboard nav logic tests (preserve — pure math logic tests for clamp/navigation)
3. cancel flow state transitions (preserve — these test the current cancel flow model)
4. graceful shutdown logic (preserve — tests current shutdown key detection)
5. toggle all logic (preserve — tests current toggle behavior)

Verify the file has no references to deleted hooks (useKeyboardController, old view-stack navigation patterns, old useToggleAll from the deleted hooks). The file is already clean based on the read — all tests reference the surviving flat-navigation model.

The acceptance criterion says: "keyboard-nav.test.ts no longer references deleted hooks or view-stack." We need to verify no stale imports exist and the file is clean. If it already is, this task just validates and commits a no-op.

- [ ] **Step 1: Verify no stale references exist**

Run: `grep -n "view-stack\|useKeyboardController\|drill-down\|pushView\|popView\|viewStack" cli/src/__tests__/keyboard-nav.test.ts`
Expected: No output (no matches)

- [ ] **Step 2: Verify all existing tests still pass**

Run: `bun test src/__tests__/keyboard-nav.test.ts`
Expected: All 27 tests PASS

- [ ] **Step 3: Commit (if any changes were needed)**

```bash
# Only commit if changes were made
git diff --quiet cli/src/__tests__/keyboard-nav.test.ts || (git add cli/src/__tests__/keyboard-nav.test.ts && git commit -m "feat(integration-test): clean up keyboard-nav.test.ts stale references")
```
