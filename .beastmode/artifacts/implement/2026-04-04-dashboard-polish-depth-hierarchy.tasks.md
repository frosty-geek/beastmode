# Depth Hierarchy — Implementation Tasks

## Goal

Add subtle background colors to create a three-tier visual depth system:
- **Tier 1 (Chrome/lightest):** Header bar + hints bar — `#403E41`
- **Tier 2 (Panel interiors/mid):** PanelBox content area — `#353236`
- **Tier 3 (Terminal background/deepest):** Terminal's own `#2D2A2E` — shows through gaps

Uses Monokai Pro colors from the shared `monokai-palette.ts` module.

## Architecture

- Ink's `<Box>` component supports `backgroundColor` prop (hex string)
- Three files to modify: `monokai-palette.ts` (add DEPTH constants), `PanelBox.tsx` (panel interior bg), `ThreePanelLayout.tsx` (header + hints bg)
- Colors come from the shared palette — no hardcoded hex in component files

## Tech Stack

- TypeScript / Ink (React for terminal)
- Bun test runner (isolated per-file via `scripts/test.sh`)

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/dashboard/monokai-palette.ts` | Modify | Add `DEPTH` constant with chrome and panel background hex values |
| `cli/src/__tests__/monokai-palette.test.ts` | Modify | Add tests for new DEPTH export |
| `cli/src/dashboard/PanelBox.tsx` | Modify | Add `backgroundColor: DEPTH.panel` to content area Box |
| `cli/src/dashboard/ThreePanelLayout.tsx` | Modify | Add `backgroundColor: DEPTH.chrome` to header and hints Boxes |
| `cli/src/__tests__/three-panel-layout.test.ts` | Modify | Add depth hierarchy tests |

---

### Task 1: Add DEPTH constants to monokai-palette

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/monokai-palette.ts:20-27`
- Modify: `cli/src/__tests__/monokai-palette.test.ts`

- [x] **Step 1: Write failing test for DEPTH export**

Add to `cli/src/__tests__/monokai-palette.test.ts` after the existing tests:

```typescript
test("DEPTH has chrome and panel background colors", () => {
  expect(DEPTH.chrome).toBe("#403E41");
  expect(DEPTH.panel).toBe("#353236");
});
```

Update the import at line 2 to include `DEPTH`:

```typescript
import { PHASE_COLOR, CHROME, DEPTH, isDim } from "../dashboard/monokai-palette.js";
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd cli && bun test src/__tests__/monokai-palette.test.ts`
Expected: FAIL — `DEPTH` is not exported from monokai-palette

- [x] **Step 3: Add DEPTH constant to monokai-palette.ts**

Add after the CHROME constant (after line 27):

```typescript
/** Background depth tiers — lightest (chrome) to mid (panels). Terminal bg is deepest. */
export const DEPTH = {
  chrome: "#403E41",
  panel: "#353236",
} as const;
```

- [x] **Step 4: Run test to verify it passes**

Run: `cd cli && bun test src/__tests__/monokai-palette.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/monokai-palette.ts cli/src/__tests__/monokai-palette.test.ts
git commit -m "feat(depth-hierarchy): add DEPTH background constants to palette"
```

---

### Task 2: Add background color to PanelBox content area

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/dashboard/PanelBox.tsx:3,42-48`

- [x] **Step 1: Update PanelBox import to include DEPTH**

In `cli/src/dashboard/PanelBox.tsx`, change line 3:

```typescript
import { CHROME, DEPTH } from "./monokai-palette.js";
```

- [x] **Step 2: Add backgroundColor to the content area Box**

In `cli/src/dashboard/PanelBox.tsx`, add `backgroundColor={DEPTH.panel}` to the content area Box (the one with `borderStyle="single"` at lines 42-48):

```tsx
      <Box
        borderStyle="single"
        borderColor={CHROME.border}
        borderTop={false}
        flexDirection="column"
        flexGrow={1}
        backgroundColor={DEPTH.panel}
      >
```

- [x] **Step 3: Run tests to verify nothing broke**

Run: `cd cli && bun test src/__tests__/monokai-palette.test.ts`
Expected: PASS (no component rendering tests to break)

- [x] **Step 4: Commit**

```bash
git add cli/src/dashboard/PanelBox.tsx
git commit -m "feat(depth-hierarchy): add panel background color to PanelBox"
```

---

### Task 3: Add background colors to header and hints bars

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/dashboard/ThreePanelLayout.tsx:6,51-52,85`
- Modify: `cli/src/__tests__/three-panel-layout.test.ts`

- [x] **Step 1: Write failing test for depth hierarchy constants**

Add to `cli/src/__tests__/three-panel-layout.test.ts` at the end:

```typescript
// ---------------------------------------------------------------------------
// Depth hierarchy background tiers
// ---------------------------------------------------------------------------

describe("depth hierarchy backgrounds", () => {
  test("chrome tier uses #403E41 for header and hints", () => {
    const { DEPTH } = require("../dashboard/monokai-palette.js");
    expect(DEPTH.chrome).toBe("#403E41");
  });

  test("panel tier uses #353236 for panel interiors", () => {
    const { DEPTH } = require("../dashboard/monokai-palette.js");
    expect(DEPTH.panel).toBe("#353236");
  });

  test("three tiers progress from lightest to darkest", () => {
    const { DEPTH } = require("../dashboard/monokai-palette.js");
    // Chrome (#403E41) > Panel (#353236) > Terminal (#2D2A2E)
    // Compare by parsing the red channel as a proxy for brightness
    const chromeR = parseInt(DEPTH.chrome.slice(1, 3), 16);
    const panelR = parseInt(DEPTH.panel.slice(1, 3), 16);
    const terminalR = parseInt("2D", 16);
    expect(chromeR).toBeGreaterThan(panelR);
    expect(panelR).toBeGreaterThan(terminalR);
  });
});
```

- [x] **Step 2: Run test to verify it passes (DEPTH already exists from Task 1)**

Run: `cd cli && bun test src/__tests__/three-panel-layout.test.ts`
Expected: PASS

- [x] **Step 3: Update ThreePanelLayout import to include DEPTH**

In `cli/src/dashboard/ThreePanelLayout.tsx`, change line 6:

```typescript
import { CHROME, DEPTH } from "./monokai-palette.js";
```

- [x] **Step 4: Add backgroundColor to header bar Box**

In `cli/src/dashboard/ThreePanelLayout.tsx`, add `backgroundColor={DEPTH.chrome}` to the banner + status bar Box (the one with `flexDirection="row" justifyContent="space-between" paddingX={1}` at line 52):

```tsx
          <Box flexDirection="row" justifyContent="space-between" paddingX={1} backgroundColor={DEPTH.chrome}>
```

- [x] **Step 5: Add backgroundColor to hints bar Box**

In `cli/src/dashboard/ThreePanelLayout.tsx`, add `backgroundColor={DEPTH.chrome}` to the hints bar Box (line 85):

```tsx
        <Box paddingX={1} backgroundColor={DEPTH.chrome}>
```

- [x] **Step 6: Run all tests to verify nothing broke**

Run: `cd cli && bun test src/__tests__/three-panel-layout.test.ts && bun test src/__tests__/monokai-palette.test.ts`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add cli/src/dashboard/ThreePanelLayout.tsx cli/src/__tests__/three-panel-layout.test.ts
git commit -m "feat(depth-hierarchy): add chrome background to header and hints bars"
```
