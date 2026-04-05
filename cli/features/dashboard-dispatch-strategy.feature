@spring-cleaning
@dashboard-dispatch-fix
Feature: Dashboard dispatches phases using iTerm2 strategy

  The dashboard dispatches phase sessions using the iTerm2 strategy.
  Dispatch uses iTerm2 exclusively, with no alternative strategies.

  Background:
    Given an epic is at phase "plan" and ready for dispatch

  Scenario: Dashboard dispatches using iTerm2 strategy
    Given the dispatch strategy is iTerm2
    When the dashboard dispatches the next phase
    Then the phase session is launched using the iTerm2 strategy
    And no fallback strategy is attempted

  Scenario: Dashboard reports dispatch failure when iTerm2 is unavailable
    Given the iTerm2 strategy is not available on this system
    When the dashboard dispatches the next phase
    Then the dispatch fails with a clear strategy-unavailable error
    And no zombie session is created
