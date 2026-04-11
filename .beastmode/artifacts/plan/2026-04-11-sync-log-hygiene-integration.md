# Integration Test Artifact: sync-log-hygiene

## New Scenarios

### Feature: sync-log-cleanup

Covers user stories [1, 2, 3].

```gherkin
@sync-log-hygiene @sync
Feature: Sync phase-aware artifact gating -- expected missing artifacts produce no log noise

  Background:
    Given a sync operation is configured for an epic

  Scenario: Design-phase sync skips PRD artifact read without logging a warning
    Given the epic is at the "design" phase
    When the sync operation runs
    Then the sync does not attempt to read the design artifact
    And the sync log output contains no warnings about missing design artifacts

  Scenario: Design-phase sync skips plan file reads without logging a warning
    Given the epic is at the "design" phase
    When the sync operation runs for a feature
    Then the sync does not attempt to read plan files
    And the sync log output contains no warnings about missing plan files

  Scenario: Plan-phase sync skips plan file reads without logging a warning
    Given the epic is at the "plan" phase
    When the sync operation runs for a feature
    Then the sync does not attempt to read plan files
    And the sync log output contains no warnings about missing plan files

  Scenario Outline: Post-threshold phases read artifacts normally
    Given the epic is at the "<phase>" phase
    When the sync operation runs
    Then the sync reads the design artifact
    And the sync reads plan files for each feature

    Examples:
      | phase     |
      | implement |
      | validate  |
      | release   |
```

```gherkin
@sync-log-hygiene @sync
Feature: Sync log level classification -- non-actionable conditions demoted from warnings

  Scenario: Idempotent branch-link retry is logged at debug level
    Given a sync operation encounters a branch that already exists
    When the branch-link operation returns a null result
    Then the event is logged at debug level
    And the event is not logged at warn level

  Scenario: Non-critical file read failure during sync is logged at debug level
    Given a sync operation encounters a file read failure for a non-critical artifact
    When the sync continues past the failure
    Then the failure is logged at debug level
    And the failure is not logged at warn or error level

  Scenario: Degraded artifact read failure is logged at warn level
    Given a sync operation encounters a file read failure for a design artifact that should exist
    When the sync continues past the failure
    Then the failure is logged at warn level
    And the failure is not logged at error level

  Scenario: Genuine GitHub API failures remain at their original log level
    Given a sync operation encounters a GitHub API authentication error
    When the sync reports the failure
    Then the failure is logged at error level
```

```gherkin
@sync-log-hygiene @sync
Feature: Sync warning context -- all warnings carry phase for correlation

  Scenario: Sync warning includes the current phase in log context
    Given an epic is at the "implement" phase
    When the sync operation logs a warning
    Then the warning log entry includes the phase "implement" in its context

  Scenario Outline: Phase context is present in warnings across all active phases
    Given an epic is at the "<phase>" phase
    When the sync operation logs a warning
    Then the warning log entry includes the phase "<phase>" in its context

    Examples:
      | phase     |
      | design    |
      | plan      |
      | implement |
      | validate  |
      | release   |

  Scenario: Non-warning log entries from sync also carry phase context
    Given an epic is at the "implement" phase
    When the sync operation logs a debug-level entry
    Then the debug log entry includes the phase "implement" in its context
```

## Consolidation

No consolidation actions identified.

The existing `level-reclassification.feature` tests general log level classification rules at the call-site audit level. Its scenario outline row "state scan failed but continuing -> warn" describes watch-loop scan failures, not sync artifact read failures. The behaviors are distinct -- no overlap.

The existing `structured-log-data.feature` scenario "Log entry preserves context fields" tests the logger infrastructure's ability to carry phase context. The new sync warning context scenarios test that sync call sites actually supply phase context. These are complementary layers (infrastructure vs. call-site behavior) -- no overlap.

No stale scenarios were identified. The sync-log-hygiene epic changes the severity of specific sync log calls and adds phase gating, but does not remove or replace any behavior covered by existing scenarios.
