# Banner Fix

## Goal

Fix the ASCII banner to correctly spell "BEASTMODE" (currently "BEASTMOKE" due to swapped D/K block characters) and add 15 trailing animated dots to the second banner line.

## Architecture

- **NyanBanner.tsx** — stateful React/Ink component rendering the banner with nyan gradient animation
- **nyan-colors.ts** — 256-step interpolated palette, `nyanColor()` maps `(charIndex + tickOffset) % 256` to palette
- **nyan-banner.test.ts** — unit tests for palette, nyanColor, and banner text properties

## Tech Stack

- Bun test runner (per-file isolation via `scripts/test.sh`)
- React/Ink for terminal rendering
- TypeScript

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `cli/src/dashboard/NyanBanner.tsx` | Modify | Fix D/K swap in BANNER_LINES, add trailing dots to line 2 |
| `cli/src/__tests__/nyan-banner.test.ts` | Modify | Update test assertions for corrected banner text and new line lengths |

---

### Task 1: Fix banner typo and add trailing dots

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/__tests__/nyan-banner.test.ts:93-121`
- Modify: `cli/src/dashboard/NyanBanner.tsx:5-8`

- [x] **Step 1: Update test expectations for corrected banner**

In `cli/src/__tests__/nyan-banner.test.ts`, update the `banner text` describe block:
- Fix the D character in BANNER_LINE_1 and BANNER_LINE_2 (swap `█▄▀`/`█▀▄` to `█▀▄`/`█▄▀`)
- Add trailing dots to BANNER_LINE_2
- Remove the equal-length assertion (lines will now differ)
- Update vertical coherence test to iterate over the shorter line

```typescript
describe("banner text", () => {
  const BANNER_LINE_1 = "█▄▄ █▀▀ ▄▀█ █▀▀ ▀█▀ █▀▄▀█ █▀█ █▀▄ █▀▀";
  const BANNER_LINE_2 = "█▄█ ██▄ █▀█ ▄▄█  █  █ ▀ █ █▄█ █▄▀ ██▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄";

  test("line 2 has 15 trailing dot characters", () => {
    const dotsSection = BANNER_LINE_2.slice(40); // after the "E" letter + space separator
    const dots = dotsSection.split(" ").filter((c) => c === "▄");
    expect(dots).toHaveLength(15);
  });

  test("banner lines contain block characters", () => {
    expect(BANNER_LINE_1).toMatch(/[█▄▀]/);
    expect(BANNER_LINE_2).toMatch(/[█▄▀]/);
  });

  test("banner lines contain spaces for word separation", () => {
    expect(BANNER_LINE_1).toContain(" ");
    expect(BANNER_LINE_2).toContain(" ");
  });

  test("vertical coherence: same charIndex gets same color on both lines", () => {
    const tick = 7;
    const minLen = Math.min(BANNER_LINE_1.length, BANNER_LINE_2.length);
    for (let i = 0; i < minLen; i++) {
      const char1 = BANNER_LINE_1[i];
      const char2 = BANNER_LINE_2[i];
      if (char1 !== " " && char2 !== " ") {
        expect(nyanColor(char1, i, tick)).toBe(nyanColor(char2, i, tick));
      }
    }
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun test src/__tests__/nyan-banner.test.ts`
Expected: FAIL — the test constants no longer match the source BANNER_LINES values

- [x] **Step 3: Fix BANNER_LINES in NyanBanner.tsx**

In `cli/src/dashboard/NyanBanner.tsx`, update BANNER_LINES:
- Line 1: swap `█▄▀` (position 30-32) to `█▀▄` for the D character
- Line 2: swap `█▀▄` (position 30-32) to `█▄▀` for the D character, and append trailing dots

```typescript
const BANNER_LINES = [
  "█▄▄ █▀▀ ▄▀█ █▀▀ ▀█▀ █▀▄▀█ █▀█ █▀▄ █▀▀",
  "█▄█ ██▄ █▀█ ▄▄█  █  █ ▀ █ █▄█ █▄▀ ██▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄ ▄",
];
```

- [x] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun test src/__tests__/nyan-banner.test.ts`
Expected: PASS — all banner text tests pass with corrected values

- [x] **Step 5: Commit**

```bash
git add cli/src/dashboard/NyanBanner.tsx cli/src/__tests__/nyan-banner.test.ts
git commit -m "fix(banner): correct D/K swap and add trailing dots"
```
