@github-sync
Feature: GitHub sync lifecycle across all phases

  GitHub issues track the full lifecycle of an epic. Labels change
  at each phase transition, feature sub-issues are created during plan,
  features are closed on completion, and the epic is closed on release.
  This feature exercises the cross-phase label and issue state lifecycle
  end-to-end with mock GitHub API calls.

  Background:
    Given GitHub sync is enabled
    And an epic "widget-auth" exists at design phase with issue number 42

  Scenario: Phase label updates across the full epic lifecycle
    When the epic transitions from design to plan
    Then the GitHub issue should have label "phase/plan"
    And the label "phase/design" should be removed

    When the epic transitions from plan to implement with features:
      | feature        |
      | oauth-provider |
      | login-flow     |
    Then the GitHub issue should have label "phase/implement"
    And feature sub-issues should be created for "oauth-provider" and "login-flow"
    And each feature sub-issue should be linked to the epic issue

    When feature "oauth-provider" completes
    Then the feature issue for "oauth-provider" should be closed

    When feature "login-flow" completes
    Then the feature issue for "login-flow" should be closed

    When the epic transitions from implement to validate
    Then the GitHub issue should have label "phase/validate"

    When the epic transitions from validate to release
    Then the GitHub issue should have label "phase/release"

    When the epic transitions from release to done
    Then the GitHub issue should be closed
    And a release comment should be posted on the epic issue

  Scenario: Validation regression reopens failed feature issues
    Given the epic is at validate phase with features:
      | feature        | status    | issue |
      | oauth-provider | completed | 43    |
      | login-flow     | completed | 44    |
    When validation fails for feature "login-flow"
    And the epic regresses to implement
    Then the feature issue for "login-flow" should be reopened
    And the feature issue for "oauth-provider" should remain closed
    And the GitHub issue should have label "phase/implement"

  Scenario: Label sync is idempotent
    Given the epic already has label "phase/design"
    When the sync runs again without a phase change
    Then no label API calls should be made
