@reconciliation
Feature: Reconciliation bootstrap from existing store state

  When the watch loop starts with epics already in the store but
  sync-refs empty (fresh install, corrupted state, or new GitHub
  repo), reconciliation bootstraps sync-refs from store data and
  creates GitHub issues for all existing epics. The second tick
  is a no-op -- idempotent convergence.

  Background:
    Given GitHub sync is enabled

  Scenario: Bootstrap creates issues for all existing epics
    Given the store contains epics:
      | slug          | phase     |
      | auth-system   | implement |
      | data-pipeline | plan      |
    And sync-refs are empty
    When the reconciliation loop runs
    Then GitHub issues should be created for "auth-system" and "data-pipeline"
    And sync-refs should contain entries for both epics
    And each sync-ref should have a body hash

  Scenario: Second reconciliation tick is a no-op
    Given the store contains epics:
      | slug          | phase     |
      | auth-system   | implement |
    And sync-refs are populated from a previous run
    And the epic body has not changed
    When the reconciliation loop runs again
    Then no GitHub API calls should be made

  Scenario: Bootstrap skips epics without discoverable state
    Given the store contains an epic "orphan-epic" with no phase
    And sync-refs are empty
    When the reconciliation loop runs
    Then no issue should be created for "orphan-epic"
    And no error should be raised
