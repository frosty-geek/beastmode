@spring-cleaning
Feature: cmux dispatch strategy is no longer available

  The cmux dispatch strategy has been removed from the system. Attempting
  to use cmux dispatch should not be possible. The system only supports
  iTerm2-based dispatch.

  Scenario: System does not offer cmux as a dispatch strategy
    Given the dispatch module is loaded
    When a developer queries available dispatch strategies
    Then cmux is not listed as an available strategy

  Scenario: Attempting to dispatch via cmux produces a clear error
    Given a developer configures dispatch strategy as cmux
    When the dashboard attempts to dispatch a phase
    Then the dispatch fails with an unknown strategy error
    And the error message does not suggest cmux as a valid option
