---
phase: plan
slug: dashboard-wiring-fix
epic: dashboard-wiring-fix
feature: integration-tests
wave: 1
---

# Integration Tests

**Design:** .beastmode/artifacts/design/2026-04-04-dashboard-wiring-fix.md

## User Stories

1. As a user, I want App.tsx to render ThreePanelLayout instead of TwoColumnLayout, so that the dashboard displays the nyan cat rainbow banner and k9s-style three-panel layout as designed.

2. As a user, I want all five flashy-dashboard PRD user stories verified end-to-end (rainbow banner cycling, 80ms tick, inline panel titles, static overview panel, full terminal height), so that the implementation matches the approved design.

## What to Build

Implement BDD integration scenarios from the integration artifact at `.beastmode/artifacts/plan/2026-04-04-dashboard-wiring-fix-integration.md`. Create `.feature` files with Gherkin scenarios covering:

- App root renders ThreePanelLayout (not TwoColumnLayout)
- Rainbow nyan banner cycles in the header
- Three-panel k9s-style proportions (35% top / 65% bottom, 30/70 top split)
- Inline panel titles (EPICS, OVERVIEW, LOG)
- Static overview panel showing pipeline state
- Full terminal height log panel
- End-to-end verification of all five flashy-dashboard requirements together

Write step definitions and configure the test runner to execute the feature files. The integration artifact contains complete Gherkin scenarios — the implementer writes the `.feature` files and wiring.

## Acceptance Criteria

- [ ] Scenario "App renders ThreePanelLayout instead of TwoColumnLayout" passes
- [ ] Scenario "Nyan banner renders in top-left of header" passes
- [ ] Scenario "Rainbow banner cycles through animation frames" passes
- [ ] Scenario "Layout has epics, overview, and log panels with correct proportions" passes
- [ ] Scenario "Each panel has an inline title" passes
- [ ] Scenario "Overview panel is static (displays pipeline state)" passes
- [ ] Scenario "Log panel renders at full terminal height below top section" passes
- [ ] Scenario "Rainbow banner, tick rate, titles, static overview, full height all work together" passes
