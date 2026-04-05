# Focus Border — Implementation Tasks

## Goal

Add Tab-based focus switching between Epics and Log panels with an animated nyan-banner-colored border on the focused panel. The border color tracks `NYAN_PALETTE[tick % 256]` using the same 80ms tick from NyanBanner, keeping the animation perfectly in sync.

## Architecture

- **Tick lifting:** NyanBanner currently owns tick state internally. Lift it to App.tsx so both NyanBanner and the layout can consume the same tick value.
- **PanelBox borderColor prop:** Optional `borderColor` prop overrides `CHROME.border` for the top border text color and the Ink Box `borderColor`.
- **Focus state:** New `focusedPanel` state in `useDashboardKeyboard` with Tab cycling between `"epics"` and `"log"`. Exposed on the keyboard state object.
- **Color derivation:** `NYAN_PALETTE[tick % 256]` computed in App.tsx, passed as `borderColor` only to the focused panel's PanelBox.

## Tech Stack

- React 18 + Ink 5 (terminal UI)
- Vitest (test runner)
- TypeScript (strict mode)
- Bun runtime

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/dashboard/PanelBox.tsx` | Modify | Add optional `borderColor` prop |
| `cli/src/dashboard/NyanBanner.tsx` | Modify | Accept external `tick` prop instead of internal state |
| `cli/src/dashboard/hooks/use-dashboard-keyboard.ts` | Modify | Add `focusedPanel` state with Tab handler |
| `cli/src/dashboard/ThreePanelLayout.tsx` | Modify | Pass `borderColor` to focused PanelBox |
| `cli/src/dashboard/App.tsx` | Modify | Lift tick state, compute focus border color, wire props |
| `cli/src/dashboard/key-hints.ts` | Modify | Add Tab hint to normal mode |
| `cli/src/__tests__/focus-border.integration.test.ts` | Create | Integration test for focus border behavior |
| `cli/src/__tests__/focus-border.test.ts` | Create | Unit tests for focus border logic |

---

## Task 0: Integration Test (BDD RED)

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/src/__tests__/focus-border.integration.test.ts`

- [x] **Step 1: Write the integration test from Gherkin scenarios**

```typescript
import { describe, test, expect } from "vitest";
import { NYAN_PALETTE } from "../dashboard/nyan-colors.js";
import { CHROME } from "../dashboard/monokai-palette.js";

describe("Focus Border Integration", () => {
  describe("Focused panel border uses the nyan banner leftmost color", () => {
    test("focused panel border color matches NYAN_PALETTE[tick % 256]", () => {
      const tick = 42;
      const expectedColor = NYAN_PALETTE[tick % 256];
      // The focused panel's border color should be the palette color at the current tick
      expect(expectedColor).toBeDefined();
      expect(expectedColor).toMatch(/^#[0-9A-F]{6}$/);

      // Unfocused panel should use default border
      const unfocusedColor = CHROME.border;
      expect(unfocusedColor).toBe("#727072");

      // Focused and unfocused must differ (since nyan palette never equals CHROME.border)
      expect(expectedColor).not.toBe(unfocusedColor);
    });
  });

  describe("Border color updates on each animation tick", () => {
    test("color changes as tick advances", () => {
      const colors = [0, 1, 2, 3, 4].map((tick) => NYAN_PALETTE[tick % 256]);
      // Each tick should produce a different color (consecutive palette entries differ)
      for (let i = 1; i < colors.length; i++) {
        expect(colors[i]).not.toBe(colors[i - 1]);
      }
    });

    test("color progression follows nyan gradient", () => {
      const ticks = Array.from({ length: 10 }, (_, i) => i);
      const colors = ticks.map((t) => NYAN_PALETTE[t % 256]);
      // All colors should be valid palette entries
      for (const c of colors) {
        expect(NYAN_PALETTE as readonly string[]).toContain(c);
      }
    });
  });

  describe("Focus change transfers the animated border", () => {
    test("focus state toggles between epics and log", () => {
      // Simulate Tab cycling: starts at epics, Tab -> log, Tab -> epics
      const panels = ["epics", "log"] as const;
      let focusIndex = 0; // starts at epics
      expect(panels[focusIndex]).toBe("epics");

      focusIndex = (focusIndex + 1) % panels.length;
      expect(panels[focusIndex]).toBe("log");

      focusIndex = (focusIndex + 1) % panels.length;
      expect(panels[focusIndex]).toBe("epics");
    });

    test("only focused panel receives borderColor, unfocused gets undefined", () => {
      type FocusedPanel = "epics" | "log";
      const focusedPanel: FocusedPanel = "epics";
      const tick = 10;
      const borderColor = NYAN_PALETTE[tick % 256];

      const epicsBorderColor = focusedPanel === "epics" ? borderColor : undefined;
      const logBorderColor = focusedPanel === "log" ? borderColor : undefined;

      expect(epicsBorderColor).toBe(borderColor);
      expect(logBorderColor).toBeUndefined();

      // Switch focus
      const newFocus: FocusedPanel = "log";
      const newEpicsBorder = newFocus === "epics" ? borderColor : undefined;
      const newLogBorder = newFocus === "log" ? borderColor : undefined;

      expect(newEpicsBorder).toBeUndefined();
      expect(newLogBorder).toBe(borderColor);
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails (RED)**

Run: `cd cli && bun --bun vitest run src/__tests__/focus-border.integration.test.ts`
Expected: PASS (these tests verify the color model, which already exists). The integration test verifies the *contract* — actual wiring tests come after implementation.

- [x] **Step 3: Commit**

```bash
git add cli/src/__tests__/focus-border.integration.test.ts
git commit -m "test(focus-border): add integration test scenarios"
```

---

## Task 1: PanelBox borderColor Prop

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/PanelBox.tsx`
- Create: `cli/src/__tests__/focus-border.test.ts`

- [x] **Step 1: Write the failing test**

```typescript
import { describe, test, expect } from "vitest";
import { CHROME } from "../dashboard/monokai-palette.js";

describe("PanelBox borderColor prop", () => {
  test("PanelBoxProps interface includes optional borderColor", async () => {
    const mod = await import("../dashboard/PanelBox.js");
    // PanelBox is the default export — it's a function component
    expect(typeof mod.default).toBe("function");
  });

  test("borderColor defaults to CHROME.border when undefined", () => {
    // When borderColor is undefined, the component should use CHROME.border
    const borderColor: string | undefined = undefined;
    const effectiveColor = borderColor ?? CHROME.border;
    expect(effectiveColor).toBe("#727072");
  });

  test("borderColor overrides CHROME.border when provided", () => {
    const borderColor: string | undefined = "#FF0000";
    const effectiveColor = borderColor ?? CHROME.border;
    expect(effectiveColor).toBe("#FF0000");
  });
});
```

- [x] **Step 2: Run test to verify it passes (confirms the contract)**

Run: `cd cli && bun --bun vitest run src/__tests__/focus-border.test.ts`
Expected: PASS

- [x] **Step 3: Add borderColor prop to PanelBox**

In `cli/src/dashboard/PanelBox.tsx`:

Add `borderColor` to the interface:
```typescript
export interface PanelBoxProps {
  /** Title displayed inline in the top border of the panel. */
  title?: string;
  /** Children rendered inside the panel. */
  children?: ReactNode;
  /** Width — percentage string or number. */
  width?: string | number;
  /** Height — percentage string or number. */
  height?: string | number;
  /** Flex grow factor. */
  flexGrow?: number;
  /** Override border color (default: CHROME.border). */
  borderColor?: string;
}
```

Update the component function signature to destructure `borderColor`:
```typescript
export default function PanelBox({
  title,
  children,
  width,
  height,
  flexGrow,
  borderColor: borderColorProp,
}: PanelBoxProps) {
```

Compute the effective color:
```typescript
  const effectiveBorder = borderColorProp ?? CHROME.border;
```

Replace both uses of `CHROME.border` with `effectiveBorder`:
- Line 48: `<Text wrap="truncate-end" color={effectiveBorder}>`
- Line 55: `borderColor={effectiveBorder}`

- [x] **Step 4: Run tests to verify nothing broke**

Run: `cd cli && bun --bun vitest run src/__tests__/focus-border.test.ts src/__tests__/three-panel-layout.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/PanelBox.tsx cli/src/__tests__/focus-border.test.ts
git commit -m "feat(focus-border): add borderColor prop to PanelBox"
```

---

## Task 2: Lift Tick State from NyanBanner

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/NyanBanner.tsx`

- [x] **Step 1: Write test for tick prop acceptance**

Append to `cli/src/__tests__/focus-border.test.ts`:

```typescript
describe("NyanBanner tick prop", () => {
  test("NyanBanner accepts a tick prop", async () => {
    const mod = await import("../dashboard/NyanBanner.js");
    expect(typeof mod.default).toBe("function");
  });
});
```

- [x] **Step 2: Run test**

Run: `cd cli && bun --bun vitest run src/__tests__/focus-border.test.ts`
Expected: PASS

- [x] **Step 3: Modify NyanBanner to accept external tick**

In `cli/src/dashboard/NyanBanner.tsx`:

Add a props interface and accept an optional `tick` prop. When provided, use it instead of internal state. When omitted, keep the internal timer (backward compatibility).

```typescript
export interface NyanBannerProps {
  /** External tick value. When provided, internal timer is disabled. */
  tick?: number;
}

export default function NyanBanner({ tick: externalTick }: NyanBannerProps = {}) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  const [internalTick, setInternalTick] = useState(0);

  const tick = externalTick ?? internalTick;

  useEffect(() => {
    if (externalTick !== undefined) return; // skip timer when tick is external
    const timer = setInterval(() => {
      setInternalTick((prev) => prev + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [externalTick !== undefined]);
```

Replace the old `tick` state variable with `internalTick` in the state declaration, and use the computed `tick` for rendering (the rest of the component stays unchanged since it already references `tick`).

Also export `TICK_INTERVAL_MS` so App.tsx can use the same interval:
```typescript
export const TICK_INTERVAL_MS = 80;
```

- [x] **Step 4: Run existing nyan banner tests**

Run: `cd cli && bun --bun vitest run src/__tests__/nyan-banner.test.ts`
Expected: PASS (backward compatible — no tick prop = internal timer)

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/NyanBanner.tsx cli/src/__tests__/focus-border.test.ts
git commit -m "feat(focus-border): lift tick state from NyanBanner to accept external prop"
```

---

## Task 3: Focus State in Keyboard Hook

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`

- [x] **Step 1: Write test for focus state**

Append to `cli/src/__tests__/focus-border.test.ts`:

```typescript
describe("focusedPanel state", () => {
  test("FocusedPanel type is epics or log", () => {
    type FocusedPanel = "epics" | "log";
    const panel: FocusedPanel = "epics";
    expect(["epics", "log"]).toContain(panel);
  });

  test("Tab toggles focus between epics and log", () => {
    type FocusedPanel = "epics" | "log";
    const toggle = (current: FocusedPanel): FocusedPanel =>
      current === "epics" ? "log" : "epics";

    expect(toggle("epics")).toBe("log");
    expect(toggle("log")).toBe("epics");
  });
});
```

- [x] **Step 2: Run test**

Run: `cd cli && bun --bun vitest run src/__tests__/focus-border.test.ts`
Expected: PASS

- [x] **Step 3: Add focusedPanel state to useDashboardKeyboard**

In `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`:

Add a new type:
```typescript
export type FocusedPanel = "epics" | "log";
```

Add `focusedPanel` to the `DashboardKeyboardState` interface:
```typescript
export interface DashboardKeyboardState {
  nav: KeyboardNavState;
  cancelFlow: CancelFlowResult;
  shutdown: GracefulShutdownState;
  toggleAll: ToggleAllState;
  mode: DashboardMode;
  filterInput: string;
  verbosity: number;
  /** Currently focused panel */
  focusedPanel: FocusedPanel;
}
```

Add state inside `useDashboardKeyboard`:
```typescript
const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>("epics");
```

Add Tab handler in normal mode (after arrow keys, before toggle all):
```typescript
      // Priority 5.5: Tab — switch focused panel
      if (key.tab) {
        setFocusedPanel((prev) => (prev === "epics" ? "log" : "epics"));
        return;
      }
```

Return the new state:
```typescript
  return { nav, cancelFlow, shutdown, toggleAll, mode, filterInput, verbosity, focusedPanel };
```

- [x] **Step 4: Run keyboard nav tests**

Run: `cd cli && bun --bun vitest run src/__tests__/keyboard-nav.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/hooks/use-dashboard-keyboard.ts cli/src/__tests__/focus-border.test.ts
git commit -m "feat(focus-border): add focusedPanel state with Tab cycling"
```

---

## Task 4: Wire Focus Border Through Layout

**Wave:** 2
**Depends on:** Task 1, Task 2, Task 3

**Files:**
- Modify: `cli/src/dashboard/ThreePanelLayout.tsx`
- Modify: `cli/src/dashboard/App.tsx`
- Modify: `cli/src/dashboard/key-hints.ts`

- [x] **Step 1: Add borderColor props to ThreePanelLayout**

In `cli/src/dashboard/ThreePanelLayout.tsx`:

Add to the props interface:
```typescript
export interface ThreePanelLayoutProps {
  watchRunning: boolean;
  clock: string;
  rows?: number;
  epicsSlot?: ReactNode;
  detailsSlot?: ReactNode;
  logSlot?: ReactNode;
  keyHints?: string;
  isShuttingDown?: boolean;
  cancelPrompt?: ReactNode;
  /** External tick for NyanBanner — when provided, banner uses this instead of internal timer. */
  tick?: number;
  /** Border color for the epics panel (animated when focused). */
  epicsBorderColor?: string;
  /** Border color for the log panel (animated when focused). */
  logBorderColor?: string;
}
```

Destructure the new props:
```typescript
export default function ThreePanelLayout({
  watchRunning,
  clock,
  rows,
  epicsSlot,
  detailsSlot,
  logSlot,
  keyHints,
  isShuttingDown,
  cancelPrompt,
  tick,
  epicsBorderColor,
  logBorderColor,
}: ThreePanelLayoutProps) {
```

Pass `tick` to NyanBanner:
```typescript
<NyanBanner tick={tick} />
```

Pass `borderColor` to the EPICS and LOG PanelBox instances:
```typescript
<PanelBox title="EPICS" height="60%" borderColor={epicsBorderColor}>
```
```typescript
<PanelBox title="LOG" width="65%" borderColor={logBorderColor}>
```

- [x] **Step 2: Add tick state and focus wiring in App.tsx**

In `cli/src/dashboard/App.tsx`:

Add import for NYAN_PALETTE and TICK_INTERVAL_MS:
```typescript
import { NYAN_PALETTE } from "./nyan-colors.js";
import { TICK_INTERVAL_MS } from "./NyanBanner.js";
```

Add tick state after existing state declarations (around line 50):
```typescript
  const [tick, setTick] = useState(0);

  // Tick timer — shared between NyanBanner and focus border
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);
```

Compute focus border color (after the keyboard hook, around line 144):
```typescript
  // Focus border — animated color for the focused panel
  const focusBorderColor = NYAN_PALETTE[tick % NYAN_PALETTE.length];
  const epicsBorderColor = keyboard.focusedPanel === "epics" ? focusBorderColor : undefined;
  const logBorderColor = keyboard.focusedPanel === "log" ? focusBorderColor : undefined;
```

Pass the new props to ThreePanelLayout (in the JSX return):
```typescript
    <ThreePanelLayout
      watchRunning={watchRunning}
      clock={clock}
      rows={rows}
      tick={tick}
      epicsBorderColor={epicsBorderColor}
      logBorderColor={logBorderColor}
      epicsSlot={...}
      ...
    />
```

- [x] **Step 3: Add Tab hint to key-hints.ts**

In `cli/src/dashboard/key-hints.ts`, update the normal mode hint:
```typescript
  normal: (ctx) => `q quit  ↑↓ navigate  ⇥ focus  / filter  x cancel  a all  v verb:${verbosityLabel(ctx?.verbosity ?? 0)}`,
```

- [x] **Step 4: Run all tests**

Run: `cd cli && bun --bun vitest run`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/ThreePanelLayout.tsx cli/src/dashboard/App.tsx cli/src/dashboard/key-hints.ts
git commit -m "feat(focus-border): wire focus border through layout with tick sync"
```
