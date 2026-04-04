---
phase: plan
slug: dashboard-wiring-fix
epic: dashboard-wiring-fix
feature: wire-three-panel-layout
wave: 2
---

# Wire Three-Panel Layout

**Design:** .beastmode/artifacts/design/2026-04-04-dashboard-wiring-fix.md

## User Stories

1. As a user, I want App.tsx to render ThreePanelLayout instead of TwoColumnLayout, so that the dashboard displays the nyan cat rainbow banner and k9s-style three-panel layout as designed.

2. As a user, I want all five flashy-dashboard PRD user stories verified end-to-end (rainbow banner cycling, 80ms tick, inline panel titles, static overview panel, full terminal height), so that the implementation matches the approved design.

3. As a user, I want TwoColumnLayout.tsx deleted after the switch, so that dead layout code doesn't accumulate in the codebase.

4. As a user, I want the TwoColumnLayout test file (two-column-layout.test.ts) deleted, so that tests for removed code don't linger.

5. As a user, I want the app-integration tests updated to reflect the ThreePanelLayout as the active layout, so that tests match reality.

## What to Build

**Layout wiring:** In the App component, replace the TwoColumnLayout import with ThreePanelLayout. Update the JSX to render ThreePanelLayout, passing the `rows` prop (already computed via `useTerminalSize()`). The prop interfaces are superset-compatible — ThreePanelLayout accepts everything TwoColumnLayout does, plus `rows`.

**Dead code deletion:** Remove TwoColumnLayout component file and its dedicated test file. Verify no remaining imports of TwoColumnLayout exist anywhere in the codebase via grep.

**Test verification:** Confirm app-integration tests pass without modification (they test pure data flow functions, not layout component identity). Run the existing three-panel-layout test suite to verify it passes. Run full test suite to catch any breakage.

**End-to-end verification:** The five flashy-dashboard requirements (rainbow banner cycling, 80ms tick, inline panel titles, static overview panel, full terminal height) are already implemented in ThreePanelLayout and its sub-components. Wiring them into App.tsx is the only missing piece. Visual smoke test confirms all five work together.

## Acceptance Criteria

- [ ] App.tsx imports and renders ThreePanelLayout (not TwoColumnLayout)
- [ ] App.tsx passes `rows` prop to ThreePanelLayout
- [ ] TwoColumnLayout.tsx is deleted from the codebase
- [ ] two-column-layout.test.ts is deleted from the codebase
- [ ] `grep -r TwoColumnLayout` returns zero matches across the codebase
- [ ] three-panel-layout.test.ts passes
- [ ] app-integration.test.ts passes
- [ ] Full test suite passes with no regressions
