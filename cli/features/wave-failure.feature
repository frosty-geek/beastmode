Feature: Wave failure in watch loop -- multi-wave dispatch ordering

  The watch loop drives implement phases as parallel feature dispatches within
  each wave. Wave ordering is enforced: wave 1 features must complete before
  wave 2 features are dispatched, even if there are enough parallel slots.

  This feature exercises the wave ordering logic across a multi-wave epic.

  Scenario: Multi-wave implementation respects wave ordering

    # -- Setup: define epic with multi-wave features --
    Given epic "auth-system" with features:
      | feature        | wave |
      | auth-provider  | 1    |
      | login-flow     | 1    |
      | token-refresh  | 2    |
    And the watch loop is initialized

    # -- Plan phase: dispatch plan --
    When both epics are seeded in "design" phase with next action "plan"
    And the watch loop ticks
    Then sessions should be active for:
      | epic        | phase |
      | auth-system | plan  |

    # -- Plan completes → implement fan-out (wave 1) --
    When all active sessions complete successfully
    Then implement sessions should respect wave ordering:
      | epic        | active features          | held features |
      | auth-system | auth-provider,login-flow | token-refresh |

    # -- Wave 1 completes → wave 2 dispatches --
    When all active sessions complete successfully
    Then implement sessions should respect wave ordering:
      | epic        | active features | held features |
      | auth-system | token-refresh   |               |

    # -- Wave 2 completes → validate --
    When all active sessions complete successfully
    Then sessions should be active for:
      | epic        | phase    |
      | auth-system | validate |
