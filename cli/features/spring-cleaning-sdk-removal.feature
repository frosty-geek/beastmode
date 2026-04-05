@spring-cleaning
Feature: SDK dispatch strategy is no longer available

  SDK-based dispatch (session factory, streaming infrastructure) has been
  removed. The system exclusively uses iTerm2-based dispatch. No SDK
  session creation or streaming pathway exists.

  Scenario: System does not offer SDK as a dispatch strategy
    Given the dispatch module is loaded
    When a developer queries available dispatch strategies
    Then SDK is not listed as an available strategy

  Scenario: Attempting to dispatch via SDK produces a clear error
    Given a developer configures dispatch strategy as SDK
    When the dashboard attempts to dispatch a phase
    Then the dispatch fails with an unknown strategy error
    And the error message does not suggest SDK as a valid option

  Scenario: Dashboard operates without SDK streaming infrastructure
    Given the dashboard is running with an active epic
    When a phase dispatch begins
    Then the dispatch uses iTerm2-based session creation
    And no SDK streaming session is created
