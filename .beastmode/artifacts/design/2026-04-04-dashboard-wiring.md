---
phase: design
slug: dashboard-wiring
epic: dashboard-wiring
---

## Problem Statement

The v0.66.0 dashboard rework created all new three-panel components (ThreePanelLayout, EpicsPanel, DetailsPanel, LogPanel, use-dashboard-keyboard) but never wired them into App.tsx. The old drill-down architecture — view-stack navigation, EpicTable, FeatureList, ActivityLog, CrumbBar, and legacy keyboard hooks — is still active and rendering. The new components are dead code. The dashboard behaves exactly as it did before the rework shipped.

## Solution

Rewrite App.tsx to instantiate ThreePanelLayout with the new panel components as slot children. Replace the old keyboard controller with use-dashboard-keyboard. Delete all old components, hooks, and the view-stack module. Clean up barrel exports, rewrite affected tests, and update the design context document to reflect the three-panel model.

## User Stories

1. As a user, I want App.tsx to render ThreePanelLayout with EpicsPanel, DetailsPanel, and LogPanel as its slots, so that the dashboard displays the k9s-style three-panel layout the original PRD specified.
2. As a user, I want the old drill-down components (EpicTable, FeatureList, AgentLog, ActivityLog, CrumbBar, view-stack) and legacy keyboard hooks (use-keyboard-controller, use-keyboard-nav, use-cancel-flow, use-toggle-all) deleted, so that there is no dead code or architectural confusion.
3. As a developer, I want an integration test that verifies App renders ThreePanelLayout and that epic selection propagates to details and log panels, so that the wiring is validated end-to-end.
4. As a developer, I want the design context (DESIGN.md dashboard section and context/design/dashboard.md) updated to describe the three-panel model instead of the push/pop drill-down, so that project documentation matches reality.

## Implementation Decisions

- **App.tsx rewrite**: Replace the view-stack switch statement with a single ThreePanelLayout render. Pass EpicsPanel, DetailsPanel, and LogPanel as slot props. Wire epic selection state so selecting an epic in EpicsPanel updates DetailsPanel and LogPanel
- **Keyboard hook swap**: Replace useKeyboardController with use-dashboard-keyboard. The new hook handles flat navigation (up/down in epics list, filter mode, cancel confirmation) without drill-down
- **LogPanel rewiring**: LogPanel is already imported in App.tsx but used as the old agent-log view. Rewire it as ThreePanelLayout's logSlot, passing the selected epic for filtering (or null for aggregate mode)
- **State threading**: EpicsPanel owns selection state (selectedIndex). App.tsx lifts this state and passes the selected epic's data down to DetailsPanel and LogPanel
- **Old component deletion**: Delete EpicTable.tsx, FeatureList.tsx, AgentLog.tsx, ActivityLog.tsx, CrumbBar.tsx, view-stack.ts, use-keyboard-controller.ts, use-keyboard-nav.ts, use-cancel-flow.ts, use-toggle-all.ts
- **Barrel export cleanup**: Update dashboard/index.ts to remove old component exports and ensure new components are exported
- **Test cleanup**: Delete or rewrite test cases in keyboard-nav.test.ts that exercise old hook logic (view-stack navigation, old cancel flow states). Preserve cancelEpicAction tests — that logic survives the transition
- **Context update**: Rewrite the Dashboard section in .beastmode/context/DESIGN.md and context/design/dashboard.md to describe three-panel layout, flat keyboard navigation, and slot-based composition instead of push/pop drill-down

## Testing Decisions

- Add an integration test for the full wiring: render App with mock data, verify ThreePanelLayout is instantiated, verify epic selection propagates to details and log panels
- Existing unit tests for ThreePanelLayout, EpicsPanel, DetailsPanel, LogPanel are comprehensive and do not need modification
- Rewrite keyboard-nav.test.ts: remove old-hook-specific test cases (view-stack navigation, old cancel flow transitions), keep cancelEpicAction tests
- Follow existing test patterns in cli/src/__tests__/ using Ink's testing utilities

## Out of Scope

- New panel features or layout changes — the three-panel design from the original PRD is unchanged
- New keyboard shortcuts beyond what use-dashboard-keyboard already implements
- Ring buffer changes, watch loop changes, or status-data.ts changes
- LogPanel content or formatting changes — just rewiring where it renders
- Replacing beastmode status or beastmode watch

## Further Notes

- The original PRD is at .beastmode/artifacts/design/2026-04-03-dashboard-rework.md — this PRD completes what that one specified
- All new panel components have existing unit tests written during v0.66.0 — this work does not need to duplicate that coverage
- use-dashboard-tree-state.ts and its tests are already in place and should not be affected

## Deferred Ideas

None
