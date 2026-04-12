@hitl
Feature: HITL config divergence across phases

  The HITL (Human-in-the-Loop) system reads per-phase prose from
  config.yaml to decide whether to auto-answer questions or defer
  to the human operator. The same epic passing through different
  phases should trigger different HITL behavior based on config.

  Scenario: Auto-approve in implement, defer in release
    Given the configuration has:
      | phase     | hitl setting                              |
      | implement | auto-answer all questions, never defer    |
      | release   | always defer to human                     |
    And an epic "widget-auth" is progressing through the pipeline

    When the implement phase starts a session
    Then HITL hooks should be configured for auto-answer
    And the session should not pause for human input

    When the release phase starts a session
    Then HITL hooks should be configured for defer
    And the session should require human approval for questions

  Scenario: Phase-specific HITL settings survive between epics
    Given the configuration has:
      | phase   | hitl setting                           |
      | design  | always defer to human                  |
      | plan    | auto-answer all questions, never defer |
    When epic "alpha" runs its design phase
    Then HITL hooks should be configured for defer

    When epic "beta" runs its plan phase
    Then HITL hooks should be configured for auto-answer

    When epic "alpha" later runs its plan phase
    Then HITL hooks should be configured for auto-answer
