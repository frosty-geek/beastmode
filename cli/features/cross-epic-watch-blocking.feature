@watch-loop
Feature: Watch loop honors cross-epic dependency blocking

  When a feature in epic B depends on a feature in epic A, the
  watch loop must not dispatch epic B's blocked features until
  epic A's dependency completes. The store's dependency resolution
  is the source of truth; the watch loop reads readiness from it.

  Scenario: Blocked epic waits for cross-epic dependency then dispatches
    Given epic "foundation" with features:
      | feature    | depends_on |
      | core-types |            |
    And epic "consumer" with features:
      | feature     | depends_on                |
      | api-client  | foundation/core-types     |
    And the watch loop is initialized

    When both epics are seeded in "design" phase with next action "plan"
    And the watch loop ticks
    And all active sessions complete successfully

    Then epic "foundation" should have active implement sessions
    And epic "consumer" should have no active implement sessions

    When the "core-types" feature of "foundation" completes
    And the watch loop ticks
    Then epic "consumer" should have active implement sessions for "api-client"

  Scenario: Multiple cross-epic dependencies must all resolve
    Given epic "foundation" with features:
      | feature    | depends_on |
      | core-types |            |
      | core-utils |            |
    And epic "consumer" with features:
      | feature    | depends_on                              |
      | api-layer  | foundation/core-types,foundation/core-utils |
    And the watch loop is initialized

    When "foundation" completes feature "core-types" but "core-utils" is still pending
    And the watch loop ticks
    Then epic "consumer" should have no active implement sessions

    When "foundation" completes feature "core-utils"
    And the watch loop ticks
    Then epic "consumer" should have active implement sessions for "api-layer"
