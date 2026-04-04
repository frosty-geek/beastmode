# Dashboard Wiring Fix — Integration Scenarios

**Date:** 2026-04-04
**Epic:** dashboard-wiring-fix
**Coverage Analysis:** 5 user stories → 6 new scenarios

## New Scenarios

All scenarios in this epic are new (no existing dashboard-specific feature files were found).

---

### Feature: App Root Renders ThreePanelLayout

App.tsx is the root component that wires the dashboard layout. It must switch from TwoColumnLayout to ThreePanelLayout.

```gherkin
@dashboard-wiring-fix
Feature: App root component uses ThreePanelLayout

  Scenario: App renders ThreePanelLayout instead of TwoColumnLayout
    Given the App component is initialized with config and verbosity
    When the App mounts for first time
    Then App renders ThreePanelLayout as the top-level layout
    And App does not render TwoColumnLayout
```

---

### Feature: Rainbow Nyan Banner Cycles

The dashboard displays a nyan cat rainbow banner in the header that animates with periodic cycling.

```gherkin
@dashboard-wiring-fix
Feature: Rainbow banner animation in header

  Scenario: Nyan banner renders in top-left of header
    Given the ThreePanelLayout is rendered
    When the dashboard displays the header
    Then the nyan cat rainbow banner appears in the top-left
    And the banner is visible to the user

  Scenario: Rainbow banner cycles through animation frames
    Given the dashboard is running
    When the watch loop is active
    Then the rainbow banner cycles through animation frames continuously
    And the cycling is visible in the header area
```

---

### Feature: Dashboard Uses Three-Panel Layout

The dashboard displays k9s-style three-panel layout with proper proportions and panel titles.

```gherkin
@dashboard-wiring-fix
Feature: Three-panel k9s-style dashboard layout

  Scenario: Layout has epics, overview, and log panels with correct proportions
    Given the ThreePanelLayout is rendered
    When the layout calculates panel dimensions
    Then the top section (epics + overview) occupies 35% of terminal height
    And the bottom section (log) occupies 65% of terminal height
    And the epics panel is 30% of top width
    And the overview panel is 70% of top width

  Scenario: Each panel has an inline title
    Given the ThreePanelLayout is rendered
    When the dashboard displays panels
    Then the epics panel shows title "EPICS" inline
    And the overview panel shows title "OVERVIEW" inline
    And the log panel shows title "LOG" inline

  Scenario: Overview panel is static (displays pipeline state)
    Given the dashboard is running
    When a user navigates to index 0 (all)
    Then the overview panel shows pipeline-wide aggregate state
    And overview content updates on watch loop events

  Scenario: Log panel renders at full terminal height below top section
    Given the ThreePanelLayout is rendered
    When the layout renders panels
    Then the log panel extends to bottom of terminal
    And the log panel fills remaining vertical space after top section
```

---

### Feature: Tick Rate and Timing

The dashboard refreshes state at 80ms intervals and updates the clock display every second.

```gherkin
@dashboard-wiring-fix
Feature: Dashboard tick rate and clock updates

  Scenario: Clock updates every 1 second
    Given the App component is mounted
    When the App initializes the clock effect
    Then the clock updates every 1000 milliseconds
    And the clock displays HH:MM:SS format
    And the clock appears in the top-right header

  Scenario: Dashboard ticks at 80ms intervals during watch loop
    Given the watch loop is active
    When the dispatcher processes session updates
    Then updates are batched and flushed every 80 milliseconds
    And the dashboard reflects the latest state within 80ms
```

---

### Feature: Flashy Dashboard PRD Verification

All five flashy-dashboard PRD requirements are verified end-to-end in the three-panel layout.

```gherkin
@dashboard-wiring-fix
Feature: Flashy dashboard requirements end-to-end verification

  Scenario: Rainbow banner, tick rate, titles, static overview, full height all work together
    Given the App component is initialized with config
    When the dashboard renders and starts the watch loop
    Then the nyan cat rainbow banner is visible and cycling in header
    And the clock in top-right updates every 1 second
    And all three panels display inline titles (EPICS, OVERVIEW, LOG)
    And the overview panel shows static pipeline state
    And the log panel extends to full remaining terminal height
    And the layout follows k9s-style three-panel proportions
    And the dashboard renders successfully with all visual features
```

---

## Modified Scenarios

None. No existing dashboard-specific feature files were found, so no modifications are needed.

---

## Deleted Scenarios

None. No existing dashboard-specific feature files were found, so no deletions are needed.

---

## Test Coverage Summary

| User Story | Coverage |
|---|---|
| 1. App.tsx renders ThreePanelLayout instead of TwoColumnLayout | ✓ "App renders ThreePanelLayout instead of TwoColumnLayout" |
| 2. All five flashy-dashboard PRD user stories verified end-to-end | ✓ "Rainbow banner, tick rate, titles, static overview, full height all work together" |
| 3. TwoColumnLayout.tsx deleted (component deletion) | Not covered by BDD (file system operation) |
| 4. two-column-layout.test.ts deleted (test cleanup) | Not covered by BDD (file system operation) |
| 5. app-integration tests updated for ThreePanelLayout | Not covered by BDD (covered by unit tests in app-integration.test.ts) |

**Note:** File deletion (stories 3–4) and unit test updates (story 5) are implementation details outside the scope of BDD integration scenarios. The integration scenarios focus on behavioral verification of the dashboard's runtime characteristics.

---

## Context & Scope

- **Project:** Beastmode CLI dashboard
- **Scope:** Dashboard component wiring and three-panel layout implementation
- **Existing Tests:** Unit tests exist for components (three-panel-layout.test.ts, app-integration.test.ts)
- **BDD Focus:** User-visible behavioral scenarios (animation, layout, updates, messaging)
