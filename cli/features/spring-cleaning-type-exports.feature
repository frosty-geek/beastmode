@spring-cleaning
Feature: Dispatch module contains only iTerm2-relevant abstractions

  SDK streaming types (ring buffer, session emitter, log entry,
  content block) have been removed from the dispatch module. Only
  types relevant to iTerm2-based dispatch remain.

  Scenario: Dispatch module does not expose streaming buffer types
    Given the dispatch module is loaded
    When a developer inspects the module's exported types
    Then no ring buffer type is exported
    And no session emitter type is exported

  Scenario: Dispatch module does not expose SDK log entry types
    Given the dispatch module is loaded
    When a developer inspects the module's exported types
    Then no SDK log entry type is exported
    And no SDK content block type is exported

  Scenario: Dispatch module exports only iTerm2 session types
    Given the dispatch module is loaded
    When a developer inspects the module's exported types
    Then iTerm2 session creation types are exported
    And no SDK-specific types are exported
