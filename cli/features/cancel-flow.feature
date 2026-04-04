Feature: Cancel and abandon flow -- mid-pipeline cleanup

  The beastmode CLI provides a cancel command that cleans up incomplete epics.
  The cleanup sequence is: remove worktree, delete archive tags, delete phase tags,
  delete artifacts, close GitHub issue (if enabled), delete manifest.

  Each step is warn-and-continue: if one step fails, the sequence continues and
  records the warning. This allows best-effort cleanup that doesn't abort on
  intermediate failures.

  This feature exercises the full cancellation lifecycle with real git worktrees,
  artifacts, and manifests. The only mock is GitHub (disabled in tests).

  Scenario: Cancel mid-pipeline removes all traces

    Given an epic "feature-x" at phase "plan"
    When the epic is cancelled with force
    Then the cancel result should have 5 cleaned steps
    And the cancel result should have 0 warnings
    And the manifest for "feature-x" should not exist
    And the worktree for "feature-x" should not exist
    And no artifacts should exist for "feature-x"

  Scenario: Cancelling twice succeeds with second run cleaning remaining artifacts

    Given an epic "feature-y" at phase "implement"
    When the epic is cancelled with force
    Then the cancel result should have 5 cleaned steps
    When the epic is cancelled again
    Then the manifest for "feature-y" should not exist
    And no artifacts should exist for "feature-y"

  Scenario: Cancel removes all artifacts for epic

    Given an epic "feature-z" at phase "design"
    When the epic is cancelled with force
    Then the cancel result should have 5 cleaned steps
    And the manifest for "feature-z" should not exist
    And no artifacts should exist for "feature-z"
