@dashboard-polish
Feature: Outer chrome border removed and panel titles render within PanelBox borders

  The dashboard does not render an outer chrome border wrapping the entire
  TUI. Each panel uses its own PanelBox border with the title rendered
  cleanly within that border, eliminating collisions between panel labels
  and stray border lines.

  Scenario: No outer chrome border wraps the dashboard
    Given the dashboard is rendered
    When I observe the outermost layout container
    Then the outermost container has no visible border

  Scenario: Epics panel has its own PanelBox border with a clean title
    Given the dashboard is rendered
    When I observe the epics panel
    Then the epics panel has a self-contained border with title "EPICS"

  Scenario: Overview panel title renders within its own border
    Given the dashboard is rendered
    When I observe the overview panel
    Then the overview panel has a self-contained border with title "OVERVIEW"

  Scenario: Log panel title renders within its own border
    Given the dashboard is rendered
    When I observe the log panel
    Then the log panel has a self-contained border with title "LOG"
