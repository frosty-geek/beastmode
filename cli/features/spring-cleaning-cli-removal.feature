@spring-cleaning
Feature: watch and status CLI commands are removed

  The beastmode watch and beastmode status CLI commands have been removed.
  The dashboard is the sole pipeline UI entry point. Attempting to invoke
  the removed commands produces a helpful error.

  Scenario: Invoking the watch command produces an error
    Given the beastmode CLI is available
    When a developer invokes the watch command
    Then the CLI reports that the watch command does not exist
    And the error suggests using the dashboard command instead

  Scenario: Invoking the status command produces an error
    Given the beastmode CLI is available
    When a developer invokes the status command
    Then the CLI reports that the status command does not exist
    And the error suggests using the dashboard command instead

  Scenario: Dashboard remains the sole pipeline UI entry point
    Given the beastmode CLI is available
    When a developer lists available commands
    Then the dashboard command is listed
    And the watch command is not listed
    And the status command is not listed
