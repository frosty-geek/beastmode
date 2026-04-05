@spring-cleaning
Feature: Session types reflect iTerm2-only dispatch

  The dispatched session and session handle types no longer carry an
  events field. Session types contain only the fields relevant to
  iTerm2-based dispatch.

  Scenario: Dispatched session type does not include an events field
    Given the dispatch module defines a dispatched session type
    When a developer inspects the dispatched session fields
    Then no events field is present on the dispatched session

  Scenario: Session handle type does not include an events field
    Given the dispatch module defines a session handle type
    When a developer inspects the session handle fields
    Then no events field is present on the session handle

  Scenario: Existing consumers of session types work without events field
    Given a pipeline component receives a dispatched session
    When the component accesses session lifecycle information
    Then the component operates correctly without an events field
