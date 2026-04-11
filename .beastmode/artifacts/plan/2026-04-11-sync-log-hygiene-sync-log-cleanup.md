---
phase: plan
slug: 00f823
epic: sync-log-hygiene
feature: sync-log-cleanup
wave: 2
---

# Sync Log Cleanup

**Design:** `.beastmode/artifacts/design/2026-04-11-00f823.md`

## User Stories

1. As a pipeline operator, I want the sync to skip artifact reads when the producing phase hasn't completed, so that expected "file not found" conditions never appear in logs.
2. As a pipeline operator, I want idempotent branch-link retries and non-critical file read failures logged at `debug` level, so that `WARN` output only contains actionable issues.
3. As a pipeline operator, I want all sync warnings to include the current phase in their log context, so that I can correlate warnings with the phase that triggered them.

## What to Build

Three coordinated changes across the sync and branch-link modules:

**Phase gates (US1):** Use `isPhaseAtOrPast` from the phase-ordering utility to guard artifact reads:
- `readPrdSections`: early-return when `epic.phase` has not yet reached past `design` — the design artifact is written at the design checkpoint, so it exists from `plan` onward
- `syncFeature` plan file reads: early-return when `epic.phase` has not yet reached past `plan` — plan artifacts are written at the plan checkpoint, so they exist from `implement` onward
- Gates log at `debug` level with a "skipped — phase not yet past threshold" message for traceability

**Log level downgrades (US2):** Reclassify 2 misleveled calls:
- Branch-link "createLinkedBranch returned null" from `warn` to `debug` — null means the branch already exists, which is the idempotent success path
- `readPrdSections` file read exception from `error` to `warn` — a readable artifact that fails to parse is degradation, not a hard error; sync continues gracefully

**Phase context enrichment (US3):** Add `{ phase: epic.phase }` to the log context for all `warn` calls in sync.ts and branch-link.ts. Where the logger supports `child()`, use `logger.child({ phase: epic.phase })` at the top of the sync entry point so all downstream calls inherit the context automatically.

Leave all 18 legitimate warn/error calls (GitHub API failures, auth issues, retry exhaustion) at their current levels.

## Integration Test Scenarios

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

## Acceptance Criteria

- [ ] `readPrdSections` skips artifact read when phase is `design` — no warn/error logged
- [ ] `syncFeature` skips plan file read when phase is `design` or `plan` — no warn/error logged
- [ ] Post-threshold phases (`implement`, `validate`, `release`) read artifacts normally
- [ ] Branch-link "returned null" logged at `debug`, not `warn`
- [ ] `readPrdSections` file read exception logged at `warn`, not `error`
- [ ] All `warn` calls in sync.ts include `phase` in log context
- [ ] All `warn` calls in branch-link.ts include `phase` in log context
- [ ] All 18 legitimate warn/error calls remain at their current levels
- [ ] Existing tests continue to pass
