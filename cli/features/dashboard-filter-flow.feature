@dashboard
Feature: Dashboard filter to details end-to-end

  The dashboard's epics panel supports phase filtering and name
  filtering. When filters narrow the visible list, selection must
  map to the correct epic, and the details panel must show the
  matching artifact content. This feature tests the full chain
  from filter input to details panel output.

  Scenario: Phase filter narrows view and selection maps correctly
    Given the dashboard has epics:
      | slug           | phase     |
      | auth-system    | implement |
      | data-pipeline  | plan      |
      | infra-setup    | done      |
    When the phase filter is set to "implement"
    Then the epics panel should show only "auth-system"
    And selecting the first epic should show "auth-system" details

  Scenario: Name filter narrows within phase filter
    Given the dashboard has epics:
      | slug           | phase     |
      | auth-system    | implement |
      | auth-refresh   | implement |
      | data-pipeline  | implement |
    When the phase filter is set to "implement"
    And the name filter is set to "auth"
    Then the epics panel should show "auth-system" and "auth-refresh"
    And "data-pipeline" should not be visible

  Scenario: Clearing filters restores full list
    Given the dashboard has epics:
      | slug           | phase     |
      | auth-system    | implement |
      | data-pipeline  | plan      |
    And the phase filter is set to "implement"
    When the phase filter is reset to "all"
    Then the epics panel should show both epics

  Scenario: Selection clamps when filter reduces list
    Given the dashboard has epics:
      | slug           | phase     |
      | auth-system    | implement |
      | data-pipeline  | plan      |
      | infra-setup    | validate  |
    And the selection is on the third epic
    When the phase filter is set to "implement"
    Then the selection should clamp to the first visible epic
    And the details panel should show "auth-system" details
