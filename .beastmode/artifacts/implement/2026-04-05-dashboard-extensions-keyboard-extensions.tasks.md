# keyboard-extensions — Implementation Tasks

## Goal

Add six keyboard extensions to the dashboard: Tab focus toggle, phase filter cycling, blocked item toggle, log panel scrolling, details panel scrolling, and updated key hints.

## Architecture

- React hooks (Ink framework) for terminal UI
- Priority-based input routing in `useDashboardKeyboard`
- Pure state-machine logic — no React rendering tests needed
- Vitest test runner with Bun runtime

## Tech Stack

- TypeScript, React (Ink), Vitest, Bun

## File Structure

| File | Responsibility |
|------|---------------|
| `cli/src/dashboard/hooks/use-dashboard-keyboard.ts` | Core keyboard hook — all new state and handlers |
| `cli/src/dashboard/key-hints.ts` | Key hint strings per mode |
| `cli/src/__tests__/keyboard-nav.test.ts` | Unit tests for keyboard logic |
| `cli/src/__tests__/keyboard-extensions.integration.test.ts` | BDD integration tests |

---

### Task 0: Integration Test Scaffolding

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/src/__tests__/keyboard-extensions.integration.test.ts`

- [x] **Step 1: Write integration test file**
Pure state-machine tests covering Gherkin scenarios for phase filter cycling, log panel scrolling, focus switching, and blocked items toggle.

- [x] **Step 2: Run test to verify RED state**
Run: `cd cli && bun --bun vitest run src/__tests__/keyboard-extensions.integration.test.ts`
Expected: PASS (pure logic tests pass even before implementation)

- [x] **Step 3: Commit**
```bash
git add cli/src/__tests__/keyboard-extensions.integration.test.ts
git commit -m "test(keyboard-extensions): add integration test scaffolding"
```

---

### Task 1: Tab Focus Toggle

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

- [x] **Step 1: Write failing tests**
Add "focus panel logic" describe block with 5 tests.

- [x] **Step 2: Implement FocusedPanel type and Tab handler**
Add `FocusedPanel` type, `focusedPanel` state, Priority 5 Tab handler.

- [x] **Step 3: Run tests**
Run: `cd cli && bun --bun vitest run src/__tests__/keyboard-nav.test.ts`
Expected: PASS

- [x] **Step 4: Commit**

---

### Task 2: Phase Filter Cycling

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

- [x] **Step 1: Write failing tests**
Add "phase filter logic" describe block with 8 tests.

- [x] **Step 2: Implement PhaseFilter type, cyclePhaseFilter, Priority 10 handler**

- [x] **Step 3: Run tests**
Expected: PASS

- [x] **Step 4: Commit**

---

### Task 3: Blocked Toggle

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

- [x] **Step 1: Write failing tests**
Add "blocked toggle logic" describe block with 5 tests.

- [x] **Step 2: Implement showBlocked state and Priority 11 handler**

- [x] **Step 3: Run tests**
Expected: PASS

- [x] **Step 4: Commit**

---

### Task 4: Log Panel Scrolling

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

- [x] **Step 1: Write failing tests**
Add "log scroll state logic" describe block with 10 tests.

- [x] **Step 2: Implement log scroll state, arrow routing by focusedPanel, G/End resume**
Add `logScrollOffset`, `logAutoFollow` state. Modify Priority 7 arrow handler to route by `focusedPanel`. Add Priority 8 G/End handler.

- [x] **Step 3: Run tests**
Expected: PASS

- [x] **Step 4: Commit**

---

### Task 5: Details Panel Scroll

**Wave:** 2
**Depends on:** -

**Files:**
- Modify: `cli/src/dashboard/hooks/use-dashboard-keyboard.ts`
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

- [x] **Step 1: Write failing tests**
Add "details scroll state logic" describe block with 6 tests.

- [x] **Step 2: Implement detailsScrollOffset state and PgUp/PgDn Priority 6 handler**

- [x] **Step 3: Run tests**
Expected: PASS

- [x] **Step 4: Commit**

---

### Task 6: Key Hints Update

**Wave:** 3
**Depends on:** Task 1, Task 2, Task 3, Task 5

**Files:**
- Modify: `cli/src/dashboard/key-hints.ts`
- Modify: `cli/src/__tests__/keyboard-nav.test.ts`

- [x] **Step 1: Write failing tests**
Add "key hints updates" describe block with 3 tests.

- [x] **Step 2: Add phaseFilter to KeyHintContext, update normal mode hint string**
Add `⇥ focus`, `p phase:${phaseFilter}`, `b blocked`, `PgUp/Dn details` to normal hint.

- [x] **Step 3: Run tests**
Expected: PASS

- [x] **Step 4: Commit**
