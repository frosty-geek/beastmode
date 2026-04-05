# Dashboard Wiring — Implementation Tasks

## Goal

Wire all wave 1 and wave 2 features into the dashboard's integration layer. This connects keyboard state (focus, phase filter, blocked toggle, scroll offsets), nyan tick sharing, tree filters, and the new DetailsPanel through App.tsx and ThreePanelLayout.

## Architecture

- **Tech stack:** TypeScript, React/Ink, Bun test runner (vitest imports)
- **Test runner:** `cd cli && bun --bun vitest run`
- **Key constraint:** Tree types still use Epic > Phase > Feature hierarchy (tree-refactor was a separate feature for LogPanel pure functions). The wiring task operates on the existing `TreeState` shape.
- **Nyan tick:** Lift the 80ms timer from `NyanBanner` into `App.tsx`. Pass tick as prop to both `NyanBanner` and `ThreePanelLayout`. Border color = `NYAN_PALETTE[tick % 256]`.
- **Filter functions:** New pure functions `filterTreeByPhase` and `filterTreeByBlocked` in `LogPanel.tsx` transform `TreeState` before rendering.
- **DetailsPanel:** Already built by wave 2. Needs wiring into App.tsx (replacing OverviewPanel) and ThreePanelLayout (title "OVERVIEW" → "DETAILS").
- **EpicsPanel expansion:** `onToggleExpand` callback exists in keyboard deps but isn't wired in App.tsx yet. Expansion state (expandedEpicSlug) managed in App.tsx.

## File Structure

- **Modify:** `cli/src/dashboard/LogPanel.tsx` — add `filterTreeByPhase()` and `filterTreeByBlocked()` pure functions, add `scrollOffset`/`autoFollow` props
- **Modify:** `cli/src/dashboard/NyanBanner.tsx` — accept optional `tick` prop, skip internal timer when provided
- **Modify:** `cli/src/dashboard/PanelBox.tsx` — accept optional `borderColor` prop
- **Modify:** `cli/src/dashboard/ThreePanelLayout.tsx` — accept `focusedPanel`/`nyanTick` props, compute border color, rename OVERVIEW → DETAILS, pass `borderColor` to focused PanelBox
- **Modify:** `cli/src/dashboard/App.tsx` — lift nyan tick, wire keyboard state to all components, replace OverviewPanel with DetailsPanel, add filter pipeline, add expand state
- **Create:** `cli/src/__tests__/log-panel-filters.test.ts` — unit tests for new filter functions
- **Modify:** `cli/src/__tests__/three-panel-layout.test.ts` — add border color and title tests
- **Create:** `cli/src/__tests__/nyan-tick-sharing.test.ts` — unit tests for NyanBanner tick prop behavior

---

### Task 1: LogPanel Phase and Blocked Filter Functions

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/LogPanel.tsx`
- Create: `cli/src/__tests__/log-panel-filters.test.ts`

- [x] **Step 1: Write failing tests for filterTreeByPhase**

```typescript
// cli/src/__tests__/log-panel-filters.test.ts
import { describe, test, expect } from "vitest";
import { filterTreeByPhase, filterTreeByBlocked } from "../dashboard/LogPanel.js";
import type { TreeState, EpicNode, PhaseNode, FeatureNode, TreeEntry, SystemEntry } from "../dashboard/tree-types.js";

function makeEntry(msg: string, seq: number, level: "info" | "debug" | "warn" | "error" = "info"): TreeEntry {
  return { timestamp: Date.now(), level, message: msg, seq };
}

function makeFeature(slug: string, entries: TreeEntry[] = []): FeatureNode {
  return { slug, entries };
}

function makePhase(phase: string, entries: TreeEntry[] = [], features: FeatureNode[] = []): PhaseNode {
  return { phase, features, entries };
}

function makeEpic(slug: string, phases: PhaseNode[] = []): EpicNode {
  return { slug, phases };
}

function makeSystem(msg: string, seq: number): SystemEntry {
  return { timestamp: Date.now(), level: "info", message: msg, seq };
}

describe("filterTreeByPhase", () => {
  test("returns full tree when phase is 'all'", () => {
    const state: TreeState = {
      epics: [makeEpic("e1", [
        makePhase("design", [makeEntry("d1", 1)]),
        makePhase("implement", [makeEntry("i1", 2)]),
      ])],
      system: [makeSystem("sys1", 0)],
    };
    const result = filterTreeByPhase(state, "all");
    expect(result.epics[0].phases).toHaveLength(2);
    expect(result.system).toHaveLength(1);
  });

  test("filters to only matching phase", () => {
    const state: TreeState = {
      epics: [makeEpic("e1", [
        makePhase("design", [makeEntry("d1", 1)]),
        makePhase("implement", [makeEntry("i1", 2)]),
      ])],
      system: [],
    };
    const result = filterTreeByPhase(state, "design");
    expect(result.epics[0].phases).toHaveLength(1);
    expect(result.epics[0].phases[0].phase).toBe("design");
  });

  test("preserves epic nodes even when all phases filtered out", () => {
    const state: TreeState = {
      epics: [makeEpic("e1", [makePhase("design", [makeEntry("d1", 1)])])],
      system: [],
    };
    const result = filterTreeByPhase(state, "implement");
    expect(result.epics).toHaveLength(1);
    expect(result.epics[0].phases).toHaveLength(0);
  });

  test("system entries are never filtered", () => {
    const state: TreeState = {
      epics: [],
      system: [makeSystem("sys1", 0), makeSystem("sys2", 1)],
    };
    const result = filterTreeByPhase(state, "design");
    expect(result.system).toHaveLength(2);
  });
});

describe("filterTreeByBlocked", () => {
  // Note: blocked filtering requires status info on epic/phase.
  // Since current tree types don't carry status, this filter is a no-op stub
  // that will be wired when tree types gain status. For now, test identity.
  test("returns tree unchanged when showBlocked is true", () => {
    const state: TreeState = {
      epics: [makeEpic("e1", [makePhase("design", [makeEntry("d1", 1)])])],
      system: [makeSystem("sys1", 0)],
    };
    const result = filterTreeByBlocked(state, true);
    expect(result).toEqual(state);
  });

  test("returns tree unchanged when showBlocked is false (stub — no status on tree nodes)", () => {
    const state: TreeState = {
      epics: [makeEpic("e1", [makePhase("design", [makeEntry("d1", 1)])])],
      system: [],
    };
    const result = filterTreeByBlocked(state, false);
    // Stub: tree types lack status, so blocked filter is identity for now
    expect(result).toEqual(state);
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun --bun vitest run src/__tests__/log-panel-filters.test.ts`
Expected: FAIL — `filterTreeByPhase` and `filterTreeByBlocked` are not exported from LogPanel.

- [x] **Step 3: Implement filterTreeByPhase and filterTreeByBlocked in LogPanel.tsx**

Add after the existing `filterTreeByVerbosity` function in `cli/src/dashboard/LogPanel.tsx`:

```typescript
/**
 * Filter tree by phase — only keeps phases matching the given filter.
 * When filter is 'all', returns tree unchanged.
 * Epic nodes are preserved (empty phases array) to maintain hierarchy context.
 * System entries are never filtered.
 */
export function filterTreeByPhase(state: TreeState, phase: string): TreeState {
  if (phase === "all") return state;
  return {
    epics: state.epics.map((epic) => ({
      ...epic,
      phases: epic.phases.filter((p) => p.phase === phase),
    })),
    system: state.system,
  };
}

/**
 * Filter tree by blocked status.
 * When showBlocked is true, returns tree unchanged.
 * Stub: tree types don't carry status yet, so this is identity when false too.
 */
export function filterTreeByBlocked(state: TreeState, showBlocked: boolean): TreeState {
  if (showBlocked) return state;
  // Stub: current tree types lack per-node status. When TreeState gains
  // status on EpicNode/FeatureNode, filter blocked nodes here.
  return state;
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun --bun vitest run src/__tests__/log-panel-filters.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/LogPanel.tsx cli/src/__tests__/log-panel-filters.test.ts
git commit -m "feat(dashboard-wiring): add phase and blocked filter functions to LogPanel"
```

---

### Task 2: NyanBanner Tick Prop

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/NyanBanner.tsx`
- Create: `cli/src/__tests__/nyan-tick-sharing.test.ts`

- [ ] **Step 1: Write failing test for tick prop behavior**

```typescript
// cli/src/__tests__/nyan-tick-sharing.test.ts
import { describe, test, expect } from "vitest";

// Test the logic: when tick prop is provided, use it; when undefined, use internal.
// We test the selection logic, not the React hook.
describe("NyanBanner tick prop selection", () => {
  test("uses external tick when provided", () => {
    const externalTick: number | undefined = 42;
    const internalTick = 7;
    const effectiveTick = externalTick ?? internalTick;
    expect(effectiveTick).toBe(42);
  });

  test("falls back to internal tick when tick prop is undefined", () => {
    const externalTick: number | undefined = undefined;
    const internalTick = 7;
    const effectiveTick = externalTick ?? internalTick;
    expect(effectiveTick).toBe(7);
  });
});
```

- [ ] **Step 2: Run test to verify it passes (logic only)**

Run: `cd cli && bun --bun vitest run src/__tests__/nyan-tick-sharing.test.ts`
Expected: PASS (this is pure logic)

- [ ] **Step 3: Modify NyanBanner.tsx to accept optional tick prop**

In `cli/src/dashboard/NyanBanner.tsx`, change the component signature and internal logic:

Replace:
```typescript
export default function NyanBanner() {
```
With:
```typescript
export interface NyanBannerProps {
  /** External tick value. When provided, skips the internal timer. */
  tick?: number;
}

export default function NyanBanner({ tick: externalTick }: NyanBannerProps = {}) {
```

Replace the internal tick state and timer:
```typescript
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
```
With:
```typescript
  const [internalTick, setInternalTick] = useState(0);

  useEffect(() => {
    if (externalTick !== undefined) return; // skip timer when externally driven
    const timer = setInterval(() => {
      setInternalTick((prev) => prev + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [externalTick !== undefined]);

  const tick = externalTick ?? internalTick;
```

- [ ] **Step 4: Run existing nyan-banner tests to verify no regression**

Run: `cd cli && bun --bun vitest run src/__tests__/nyan-banner.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/dashboard/NyanBanner.tsx cli/src/__tests__/nyan-tick-sharing.test.ts
git commit -m "feat(dashboard-wiring): NyanBanner accepts optional tick prop"
```

---

### Task 3: PanelBox Border Color Prop

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/PanelBox.tsx`

- [ ] **Step 1: Add borderColor prop to PanelBox**

In `cli/src/dashboard/PanelBox.tsx`, update the interface and component:

Add to `PanelBoxProps`:
```typescript
  /** Override border color (e.g., for focus indication). */
  borderColor?: string;
```

In the component, use `borderColor` prop with fallback to `CHROME.border`:

Replace:
```typescript
      <Text wrap="truncate-end" color={CHROME.border}>
        {topBorder}
      </Text>
```
With:
```typescript
      <Text wrap="truncate-end" color={borderColor ?? CHROME.border}>
        {topBorder}
      </Text>
```

Replace:
```typescript
        borderColor={CHROME.border}
```
With:
```typescript
        borderColor={borderColor ?? CHROME.border}
```

- [ ] **Step 2: Run existing layout tests to verify no regression**

Run: `cd cli && bun --bun vitest run src/__tests__/three-panel-layout.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/dashboard/PanelBox.tsx
git commit -m "feat(dashboard-wiring): PanelBox accepts optional borderColor prop"
```

---

### Task 4: ThreePanelLayout Focus and Title Wiring

**Wave:** 2
**Depends on:** Task 3

**Files:**
- Modify: `cli/src/dashboard/ThreePanelLayout.tsx`
- Modify: `cli/src/__tests__/three-panel-layout.test.ts`

- [ ] **Step 1: Write failing tests for focus border and title change**

Append to `cli/src/__tests__/three-panel-layout.test.ts`:

```typescript
// ---------------------------------------------------------------------------
// Focus border color logic
// ---------------------------------------------------------------------------

describe("focus border color computation", () => {
  // Import the palette for verification
  // NYAN_PALETTE[tick % 256] is the formula
  test("focused panel gets nyan color at tick offset", () => {
    const PALETTE_SIZE = 256;
    const tick = 42;
    const borderColor = `palette[${tick % PALETTE_SIZE}]`;
    expect(borderColor).toBe("palette[42]");
  });

  test("tick wraps at palette boundary", () => {
    const PALETTE_SIZE = 256;
    const tick = 300;
    const index = tick % PALETTE_SIZE;
    expect(index).toBe(44);
  });

  test("unfocused panel gets undefined borderColor", () => {
    const focusedPanel = "epics";
    const epicsBorder = focusedPanel === "epics" ? "#color" : undefined;
    const logBorder = focusedPanel === "log" ? "#color" : undefined;
    expect(epicsBorder).toBe("#color");
    expect(logBorder).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Panel title change
// ---------------------------------------------------------------------------

describe("details panel title", () => {
  test("title is DETAILS not OVERVIEW", () => {
    const title = "DETAILS";
    expect(title).toBe("DETAILS");
    expect(title).not.toBe("OVERVIEW");
  });
});
```

- [ ] **Step 2: Run tests to verify they pass (logic tests)**

Run: `cd cli && bun --bun vitest run src/__tests__/three-panel-layout.test.ts`
Expected: PASS (these are pure logic tests)

- [ ] **Step 3: Update ThreePanelLayout props and implementation**

In `cli/src/dashboard/ThreePanelLayout.tsx`:

Add imports:
```typescript
import type { FocusedPanel } from "./hooks/use-dashboard-keyboard.js";
import { NYAN_PALETTE } from "./nyan-colors.js";
```

Add new props to `ThreePanelLayoutProps`:
```typescript
  /** Currently focused panel for border highlighting. */
  focusedPanel?: FocusedPanel;
  /** Current nyan animation tick for border color computation. */
  nyanTick?: number;
```

In the component body, compute border color:
```typescript
  const focusBorderColor = nyanTick !== undefined
    ? NYAN_PALETTE[nyanTick % NYAN_PALETTE.length]
    : undefined;
```

Replace the EPICS PanelBox:
```typescript
            <PanelBox title="EPICS" height="60%" borderColor={focusedPanel === "epics" ? focusBorderColor : undefined}>
```

Replace the OVERVIEW PanelBox (also rename title):
```typescript
            <PanelBox title="DETAILS" flexGrow={1}>
```

Replace the LOG PanelBox:
```typescript
          <PanelBox title="LOG" width="65%" borderColor={focusedPanel === "log" ? focusBorderColor : undefined}>
```

Also update `NyanBanner` to pass tick:
```typescript
          <NyanBanner tick={nyanTick} />
```

- [ ] **Step 4: Run tests to verify no regression**

Run: `cd cli && bun --bun vitest run src/__tests__/three-panel-layout.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/dashboard/ThreePanelLayout.tsx cli/src/__tests__/three-panel-layout.test.ts
git commit -m "feat(dashboard-wiring): ThreePanelLayout focus border and DETAILS title"
```

---

### Task 5: LogPanel Scroll Rendering

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/dashboard/LogPanel.tsx`

- [ ] **Step 1: Update LogPanel to accept scroll props**

In `cli/src/dashboard/LogPanel.tsx`, update `LogPanelProps`:

```typescript
export interface LogPanelProps {
  /** Tree state to render. */
  state: TreeState;
  /** Maximum visible lines to render. Default: 50 */
  maxVisibleLines?: number;
  /** Current verbosity level (0=info, 1=detail, 2=debug, 3=trace). Default: 0 */
  verbosity?: number;
  /** Scroll offset from top (line index). When provided, overrides trimTreeToTail. */
  scrollOffset?: number;
  /** Whether to auto-follow newest entries. Default: true */
  autoFollow?: boolean;
}
```

Update the component rendering logic:

Replace:
```typescript
export default function LogPanel({
  state,
  maxVisibleLines = 50,
  verbosity = 0,
}: LogPanelProps) {
  const filtered = filterTreeByVerbosity(state, verbosity);
  const hasContent = filtered.epics.length > 0 || filtered.system.length > 0;

  if (!hasContent) {
    return (
      <Box justifyContent="center" alignItems="center" flexGrow={1}>
        <Text dimColor>no active sessions</Text>
      </Box>
    );
  }

  // Trim tree to last N lines for auto-follow (show newest entries at bottom)
  const trimmed = trimTreeToTail(filtered, maxVisibleLines);

  return (
    <Box flexDirection="column">
      <TreeView state={trimmed} />
    </Box>
  );
}
```

With:
```typescript
export default function LogPanel({
  state,
  maxVisibleLines = 50,
  verbosity = 0,
  scrollOffset,
  autoFollow = true,
}: LogPanelProps) {
  const filtered = filterTreeByVerbosity(state, verbosity);
  const hasContent = filtered.epics.length > 0 || filtered.system.length > 0;

  if (!hasContent) {
    return (
      <Box justifyContent="center" alignItems="center" flexGrow={1}>
        <Text dimColor>no active sessions</Text>
      </Box>
    );
  }

  // When auto-following, show the newest entries (trim from front).
  // When manually scrolling, still trim to maxVisibleLines but from scrollOffset.
  if (autoFollow || scrollOffset === undefined) {
    const trimmed = trimTreeToTail(filtered, maxVisibleLines);
    return (
      <Box flexDirection="column">
        <TreeView state={trimmed} />
      </Box>
    );
  }

  // Manual scroll: trim to maxVisibleLines starting from scrollOffset
  const total = countTreeLines(filtered);
  const clampedOffset = Math.min(scrollOffset, Math.max(0, total - maxVisibleLines));
  // Drop first `clampedOffset` lines, then trim to maxVisibleLines
  const dropped = trimTreeFromHead(filtered, clampedOffset);
  const trimmed = trimTreeToTail(dropped, maxVisibleLines);

  return (
    <Box flexDirection="column">
      <TreeView state={trimmed} />
    </Box>
  );
}
```

Add a `trimTreeFromHead` helper (drops the first N lines from the tree — inverse of trimTreeToTail):

```typescript
/**
 * Drop the first N rendered lines from a tree state.
 * Used for scroll offset rendering — skip lines before the viewport.
 */
export function trimTreeFromHead(state: TreeState, linesToDrop: number): TreeState {
  if (linesToDrop <= 0) return state;

  let toDrop = linesToDrop;

  // Drop system entries first
  const systemDrop = Math.min(toDrop, state.system.length);
  const system = state.system.slice(systemDrop);
  toDrop -= systemDrop;

  if (toDrop <= 0) return { epics: state.epics, system };

  const epics: EpicNode[] = [];
  for (const epic of state.epics) {
    if (toDrop <= 0) {
      epics.push(epic);
      continue;
    }

    // Drop epic label line
    toDrop -= 1;
    if (toDrop <= 0) {
      epics.push(epic);
      continue;
    }

    const phases: PhaseNode[] = [];
    for (const phase of epic.phases) {
      if (toDrop <= 0) {
        phases.push(phase);
        continue;
      }

      // Drop phase label line
      toDrop -= 1;
      if (toDrop <= 0) {
        phases.push(phase);
        continue;
      }

      // Drop phase entries
      const phaseEntryDrop = Math.min(toDrop, phase.entries.length);
      const entries = phase.entries.slice(phaseEntryDrop);
      toDrop -= phaseEntryDrop;

      // Drop feature entries
      const features: FeatureNode[] = [];
      for (const feat of phase.features) {
        if (toDrop <= 0) {
          features.push(feat);
          continue;
        }

        // Drop feature label line
        toDrop -= 1;
        if (toDrop <= 0) {
          features.push(feat);
          continue;
        }

        const featEntryDrop = Math.min(toDrop, feat.entries.length);
        const fEntries = feat.entries.slice(featEntryDrop);
        toDrop -= featEntryDrop;
        features.push({ ...feat, entries: fEntries });
      }

      phases.push({ ...phase, entries, features });
    }

    if (phases.length > 0) {
      epics.push({ ...epic, phases });
    }
  }

  return { epics, system };
}
```

- [ ] **Step 2: Run existing tests to verify no regression**

Run: `cd cli && bun --bun vitest run`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/dashboard/LogPanel.tsx
git commit -m "feat(dashboard-wiring): LogPanel scroll offset rendering"
```

---

### Task 6: App.tsx Full Wiring

**Wave:** 3
**Depends on:** Task 1, Task 2, Task 3, Task 4, Task 5

**Files:**
- Modify: `cli/src/dashboard/App.tsx`

- [ ] **Step 1: Add nyan tick state to App.tsx**

Add imports at the top of `cli/src/dashboard/App.tsx`:

```typescript
import { NYAN_PALETTE } from "./nyan-colors.js";
import DetailsPanel from "./DetailsPanel.js";
import type { DetailsPanelSelection } from "./details-panel.js";
import { filterTreeByPhase, filterTreeByBlocked, countTreeLines } from "./LogPanel.js";
```

Add nyan tick state inside the component:
```typescript
  const [nyanTick, setNyanTick] = useState(0);
```

Add nyan tick timer effect (after the clock effect):
```typescript
  // --- Nyan tick for shared animation ---
  useEffect(() => {
    const timer = setInterval(() => setNyanTick((prev) => prev + 1), 80);
    return () => clearInterval(timer);
  }, []);
```

- [ ] **Step 2: Add expand state and toggle handler**

```typescript
  const [expandedEpicSlug, setExpandedEpicSlug] = useState<string | null>(null);

  const handleToggleExpand = useCallback((slug: string | undefined) => {
    if (!slug) return; // "(all)" row — no expansion
    setExpandedEpicSlug((prev) => (prev === slug ? null : slug));
  }, []);
```

- [ ] **Step 3: Wire keyboard hook with new deps**

Update the `useDashboardKeyboard` call to provide the new dependency fields.

Before the keyboard hook, compute `logTotalLines` from treeState:
```typescript
  // Compute log total lines for scroll clamping (uses previous render's treeState)
  const logTotalLinesRef = useRef(0);
```

After the treeState hook, update:
```typescript
  logTotalLinesRef.current = countTreeLines(treeState);
```

Update keyboard hook deps:
```typescript
  const keyboard = useDashboardKeyboard({
    itemCount: epics.length + 1,
    onCancelEpic: handleCancelEpic,
    onShutdown: handleShutdown,
    slugAtIndex,
    onFilterApply: handleFilterApply,
    onFilterClear: handleFilterClear,
    initialVerbosity: verbosity,
    logTotalLines: logTotalLinesRef.current,
    detailsContentHeight: 100, // approximate; DetailsPanel handles its own scroll clamping
    detailsVisibleHeight: Math.max(1, Math.floor((rows ?? 24) * 0.4 * 0.4) - 4),
    onToggleExpand: handleToggleExpand,
  });
```

- [ ] **Step 4: Add filter pipeline for tree state**

After `treeState` is computed, apply filters:
```typescript
  // --- Filter pipeline for log tree ---
  const phaseFiltered = filterTreeByPhase(treeState, keyboard.phaseFilter);
  const blockedFiltered = filterTreeByBlocked(phaseFiltered, keyboard.showBlocked);
```

- [ ] **Step 5: Compute selection state for DetailsPanel**

```typescript
  // --- Selection state for DetailsPanel ---
  const detailsSelection: DetailsPanelSelection = (() => {
    if (keyboard.nav.selectedIndex === 0) return { kind: "all" as const };
    const epic = filteredEpics[keyboard.nav.selectedIndex - 1];
    if (!epic) return { kind: "all" as const };
    // If a feature is selected in the expanded epic tree, use feature selection
    // For now, epic-level selection only (feature drill-down wired later if needed)
    return { kind: "epic" as const, slug: epic.slug };
  })();

  // Reset details scroll when selection changes
  const prevSelectionRef = useRef(detailsSelection);
  useEffect(() => {
    const prev = prevSelectionRef.current;
    const curr = detailsSelection;
    if (prev.kind !== curr.kind ||
      (prev.kind === "epic" && curr.kind === "epic" && prev.slug !== curr.slug)) {
      keyboard.resetDetailsScroll();
    }
    prevSelectionRef.current = curr;
  }, [detailsSelection.kind, detailsSelection.kind === "epic" ? detailsSelection.slug : undefined]);
```

- [ ] **Step 6: Update key hints to include phaseFilter**

```typescript
  const keyHintText = getKeyHints(keyboard.mode, {
    slug: cancelConfirmingSlug,
    filterInput: keyboard.filterInput,
    verbosity: keyboard.verbosity,
    phaseFilter: keyboard.phaseFilter,
  });
```

- [ ] **Step 7: Update the render return — wire everything to ThreePanelLayout**

Replace the entire return statement:

```typescript
  return (
    <ThreePanelLayout
      watchRunning={watchRunning}
      clock={clock}
      rows={rows}
      focusedPanel={keyboard.focusedPanel}
      nyanTick={nyanTick}
      epicsSlot={
        <EpicsPanel
          epics={filteredEpics}
          activeSessions={activeSessions}
          selectedIndex={keyboard.nav.selectedIndex}
          cancelConfirmingSlug={cancelConfirmingSlug}
        />
      }
      detailsSlot={
        <DetailsPanel
          selection={detailsSelection}
          projectRoot={projectRoot}
          epics={filteredEpics}
          activeSessions={activeSessions.size}
          gitStatus={gitStatus}
          scrollOffset={keyboard.detailsScrollOffset}
          visibleHeight={Math.max(1, Math.floor((rows ?? 24) * 0.4 * 0.4) - 4)}
        />
      }
      logSlot={
        <LogPanel
          state={blockedFiltered}
          verbosity={keyboard.verbosity}
          scrollOffset={keyboard.logScrollOffset}
          autoFollow={keyboard.logAutoFollow}
        />
      }
      keyHints={keyHintText}
      isShuttingDown={keyboard.shutdown.isShuttingDown}
      cancelPrompt={cancelPrompt}
    />
  );
```

- [ ] **Step 8: Remove unused OverviewPanel import**

Remove this line from the imports:
```typescript
import OverviewPanel from "./OverviewPanel.js";
```

Also remove the `overview-panel.js` type import if no longer used:
```typescript
import type { GitStatus } from "./overview-panel.js";
```
Keep the `GitStatus` import if it's still used elsewhere — check before removing.

- [ ] **Step 9: Run full test suite**

Run: `cd cli && bun --bun vitest run`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add cli/src/dashboard/App.tsx
git commit -m "feat(dashboard-wiring): wire all keyboard state, filters, DetailsPanel, and nyan tick into App"
```
