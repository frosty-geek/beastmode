# Phase Ordering Utility — Implementation Tasks

## Goal

Add an `isPhaseAtOrPast(current: Phase, threshold: Phase): boolean` function to `cli/src/types.ts` where `phaseIndex()` and `PHASE_ORDER` already live. The function returns `true` when the current phase is at or past the threshold in the workflow progression.

Semantics:
- Workflow phases use their index in `PHASE_ORDER` for comparison
- Terminal phases (`done`, `cancelled`) are treated as past all workflow phases — return `true` for any threshold
- If the threshold itself is a terminal phase, only terminal phases satisfy it

## Architecture

- **Runtime:** Bun + TypeScript
- **Test framework:** vitest (`bun --bun vitest run`)
- **Target file:** `cli/src/types.ts` — append after `phaseIndex()`
- **Test file:** `cli/src/__tests__/phase-ordering.test.ts` — new file

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `cli/src/types.ts` | Modify | Add `isPhaseAtOrPast` export |
| `cli/src/__tests__/phase-ordering.test.ts` | Create | Unit tests for `isPhaseAtOrPast` |

---

### Task 1: Add `isPhaseAtOrPast` with full unit test coverage

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/types.ts:82-89` (after `phaseIndex`)
- Create: `cli/src/__tests__/phase-ordering.test.ts`

- [x] **Step 1: Write the failing test file**

Create `cli/src/__tests__/phase-ordering.test.ts`:

```typescript
import { describe, test, expect } from "vitest";
import { isPhaseAtOrPast } from "../types.js";
import type { Phase } from "../types.js";

describe("isPhaseAtOrPast", () => {
  describe("identity cases — phase equals threshold", () => {
    test.each<Phase>(["design", "plan", "implement", "validate", "release"])(
      "%s is at or past itself",
      (phase) => {
        expect(isPhaseAtOrPast(phase, phase)).toBe(true);
      },
    );
  });

  describe("forward progression — current past threshold", () => {
    test("implement is past plan", () => {
      expect(isPhaseAtOrPast("implement", "plan")).toBe(true);
    });

    test("release is past design", () => {
      expect(isPhaseAtOrPast("release", "design")).toBe(true);
    });

    test("validate is past implement", () => {
      expect(isPhaseAtOrPast("validate", "implement")).toBe(true);
    });
  });

  describe("backward — current before threshold", () => {
    test("design is not past plan", () => {
      expect(isPhaseAtOrPast("design", "plan")).toBe(false);
    });

    test("plan is not past implement", () => {
      expect(isPhaseAtOrPast("plan", "implement")).toBe(false);
    });

    test("implement is not past validate", () => {
      expect(isPhaseAtOrPast("implement", "validate")).toBe(false);
    });
  });

  describe("boundary pairs", () => {
    test("design/plan boundary", () => {
      expect(isPhaseAtOrPast("design", "plan")).toBe(false);
      expect(isPhaseAtOrPast("plan", "design")).toBe(true);
    });

    test("plan/implement boundary", () => {
      expect(isPhaseAtOrPast("plan", "implement")).toBe(false);
      expect(isPhaseAtOrPast("implement", "plan")).toBe(true);
    });

    test("implement/validate boundary", () => {
      expect(isPhaseAtOrPast("implement", "validate")).toBe(false);
      expect(isPhaseAtOrPast("validate", "implement")).toBe(true);
    });

    test("validate/release boundary", () => {
      expect(isPhaseAtOrPast("validate", "release")).toBe(false);
      expect(isPhaseAtOrPast("release", "validate")).toBe(true);
    });
  });

  describe("terminal phases — done and cancelled", () => {
    test("done is past all workflow phases", () => {
      expect(isPhaseAtOrPast("done", "design")).toBe(true);
      expect(isPhaseAtOrPast("done", "plan")).toBe(true);
      expect(isPhaseAtOrPast("done", "implement")).toBe(true);
      expect(isPhaseAtOrPast("done", "validate")).toBe(true);
      expect(isPhaseAtOrPast("done", "release")).toBe(true);
    });

    test("cancelled is past all workflow phases", () => {
      expect(isPhaseAtOrPast("cancelled", "design")).toBe(true);
      expect(isPhaseAtOrPast("cancelled", "plan")).toBe(true);
      expect(isPhaseAtOrPast("cancelled", "implement")).toBe(true);
      expect(isPhaseAtOrPast("cancelled", "validate")).toBe(true);
      expect(isPhaseAtOrPast("cancelled", "release")).toBe(true);
    });

    test("workflow phases are not past terminal threshold done", () => {
      expect(isPhaseAtOrPast("design", "done")).toBe(false);
      expect(isPhaseAtOrPast("release", "done")).toBe(false);
    });

    test("workflow phases are not past terminal threshold cancelled", () => {
      expect(isPhaseAtOrPast("design", "cancelled")).toBe(false);
      expect(isPhaseAtOrPast("release", "cancelled")).toBe(false);
    });

    test("done satisfies done threshold", () => {
      expect(isPhaseAtOrPast("done", "done")).toBe(true);
    });

    test("cancelled satisfies cancelled threshold", () => {
      expect(isPhaseAtOrPast("cancelled", "cancelled")).toBe(true);
    });

    test("done satisfies cancelled threshold", () => {
      expect(isPhaseAtOrPast("done", "cancelled")).toBe(true);
    });

    test("cancelled satisfies done threshold", () => {
      expect(isPhaseAtOrPast("cancelled", "done")).toBe(true);
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `cd cli && bun --bun vitest run src/__tests__/phase-ordering.test.ts`
Expected: FAIL — `isPhaseAtOrPast` is not exported from `../types.js`

- [x] **Step 3: Implement `isPhaseAtOrPast` in types.ts**

Add after the `phaseIndex` function in `cli/src/types.ts`:

```typescript
/** Check whether `current` phase is at or past `threshold` in the workflow progression.
 *  Terminal phases (done, cancelled) are considered past all workflow phases.
 *  If threshold is a terminal phase, only terminal phases satisfy it. */
export function isPhaseAtOrPast(current: Phase, threshold: Phase): boolean {
  const currentIdx = phaseIndex(current);
  const thresholdIdx = phaseIndex(threshold);

  // Both terminal — always true (done/cancelled are interchangeable for ordering)
  if (currentIdx === -1 && thresholdIdx === -1) return true;

  // Current is terminal, threshold is workflow — terminal is past everything
  if (currentIdx === -1) return true;

  // Threshold is terminal, current is workflow — workflow never reaches terminal
  if (thresholdIdx === -1) return false;

  // Both workflow — compare indices
  return currentIdx >= thresholdIdx;
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `cd cli && bun --bun vitest run src/__tests__/phase-ordering.test.ts`
Expected: PASS — all tests green

- [x] **Step 5: Commit**

```bash
git add cli/src/types.ts cli/src/__tests__/phase-ordering.test.ts
git commit -m "feat(phase-ordering): add isPhaseAtOrPast utility"
```
