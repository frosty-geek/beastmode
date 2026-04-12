@worktree
Feature: Worktree lifecycle across phases

  Each epic gets a git worktree created at its first phase. The
  worktree persists across phase transitions so artifacts accumulate.
  On release completion, the worktree is cleaned up. On cancellation,
  the worktree is also cleaned up.

  This feature exercises the normal multi-phase worktree lifecycle
  with a real temporary git repository.

  Scenario: Worktree persists across phases and is cleaned up on release
    Given a fresh git repository with beastmode structure
    And a manifest is seeded for epic "widget-auth"

    When the pipeline runs the design phase
    Then a worktree should exist for "widget-auth"
    And design artifacts should be in the worktree

    When the pipeline runs the plan phase
    Then the same worktree should still exist for "widget-auth"
    And plan artifacts should be added to the worktree

    When all implement features complete
    And the pipeline runs the validate phase
    Then the same worktree should still exist for "widget-auth"

    When the pipeline runs the release phase
    Then the worktree for "widget-auth" should be cleaned up
    And the worktree directory should no longer exist

  Scenario: Worktree is cleaned up on cancellation
    Given a fresh git repository with beastmode structure
    And a manifest is seeded for epic "doomed-feature"

    When the pipeline runs the design phase
    Then a worktree should exist for "doomed-feature"

    When the epic is cancelled
    Then the worktree for "doomed-feature" should be cleaned up
    And the worktree directory should no longer exist
