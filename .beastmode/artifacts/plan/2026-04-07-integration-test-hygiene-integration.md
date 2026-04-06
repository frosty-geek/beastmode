---
phase: plan
epic: integration-test-hygiene
date: 2026-04-07
---

# Integration Test Scenarios — integration-test-hygiene

## New Scenarios

### Feature: skip-gate

Covers user stories [1].

```gherkin
@integration-test-hygiene
Feature: Plan skill skip gate -- integration-tester agent is not dispatched for non-behavioral epics

  The plan skill evaluates each feature's behavioral impact before
  dispatching the plan-integration-tester agent. Features that only
  change documentation, refactor code, modify configuration, or fix
  bugs with existing test coverage produce no new behavioral scenarios
  and should not trigger an agent dispatch. The gate fires per epic:
  if all features are non-behavioral, no integration artifact is produced
  and no integration-tests feature appears in the plan.

  Background:
    Given the plan skill is configured to spawn the plan-integration-tester agent

  Scenario: Documentation-only epic skips integration test generation
    Given an epic whose features only change documentation content
    When the plan phase runs for the epic
    Then the plan-integration-tester agent is not dispatched
    And no integration artifact is produced
    And no integration-tests feature appears in the plan output

  Scenario: Refactoring epic skips integration test generation
    Given an epic whose features only restructure existing code without changing behavior
    When the plan phase runs for the epic
    Then the plan-integration-tester agent is not dispatched
    And no integration artifact is produced

  Scenario: Configuration-change epic skips integration test generation
    Given an epic whose features only change configuration values or schema
    When the plan phase runs for the epic
    Then the plan-integration-tester agent is not dispatched
    And no integration artifact is produced

  Scenario: Bug fix with existing coverage skips integration test generation
    Given an epic whose features fix a known bug
    And existing integration scenarios already cover the affected behavior
    When the plan phase runs for the epic
    Then the plan-integration-tester agent is not dispatched
    And no integration artifact is produced

  Scenario: Epic with at least one behavioral feature dispatches the agent
    Given an epic that mixes a documentation feature and a feature adding new user-visible behavior
    When the plan phase runs for the epic
    Then the plan-integration-tester agent is dispatched
    And only the behavioral features are sent to the agent
    And an integration artifact is produced

  Scenario: Agent dispatch failure does not abort the plan phase
    Given an epic with behavioral features
    And the plan-integration-tester agent reports NEEDS_CONTEXT
    When the plan phase runs for the epic
    Then the plan phase completes successfully
    And a warning is recorded that integration test generation was skipped
    And no integration-tests feature appears in the plan output
```

### Feature: agent-consolidation

Covers user stories [2, 3, 4, 5].

```gherkin
@integration-test-hygiene
Feature: Plan-integration-tester agent suite consolidation -- overlapping and stale scenarios are resolved inline

  On every invocation the agent reviews the full existing test suite for
  overlapping scenarios (same behavioral intent in multiple files) and
  stale scenarios (behavior that no longer exists or has changed). Consolidation
  runs inline alongside new scenario generation. The output artifact uses two
  sections (New Scenarios and Consolidation) rather than three (New/Modified/Deleted).
  Scenarios are organized by capability domain and tagged with both epic and
  capability tags. Test depth follows happy paths first; error paths only when
  they represent high-risk user-visible behavior.

  Background:
    Given the plan-integration-tester agent has access to the existing test suite

  Scenario: Overlapping scenarios from different epics are merged into one
    Given the existing test suite contains two scenarios that cover the same behavioral intent
    And the two scenarios originate from different epics
    When the agent generates the integration artifact for the current epic
    Then the Consolidation section describes the merge of the two scenarios into one canonical scenario
    And the resulting scenario is tagged with the current epic tag and the relevant capability tag

  Scenario: Stale scenario for removed functionality is marked for deletion
    Given the existing test suite contains a scenario that covers behavior no longer present in the system
    When the agent generates the integration artifact for the current epic
    Then the Consolidation section identifies the stale scenario for removal
    And the reason references the superseding change

  Scenario: New scenarios are organized by capability domain, not by originating feature
    Given an epic whose user stories span multiple capability domains
    When the agent generates the integration artifact
    Then the New Scenarios section groups scenarios under capability domain headings
    And each scenario carries a capability tag in addition to the epic tag

  Scenario: Every capability domain has at least one happy-path scenario
    Given an epic that introduces new behavior in a capability domain
    When the agent generates the integration artifact
    Then the New Scenarios section includes at least one happy-path scenario for that capability domain
    And the happy-path scenario uses a representative successful end-to-end flow

  Scenario: Error paths are included only for high-risk behavior
    Given an epic whose features include both routine error handling and a high-risk failure mode
    When the agent generates the integration artifact
    Then the New Scenarios section includes a scenario for the high-risk failure mode
    And the routine error handling is not represented as a separate integration scenario

  Scenario: Artifact uses two-section structure with New Scenarios and Consolidation
    Given an epic with behavioral features and overlapping existing scenarios
    When the agent produces the integration artifact
    Then the artifact contains a New Scenarios section
    And the artifact contains a Consolidation section
    And the Consolidation section tracks all modifications and deletions to existing scenarios
    And the artifact does not contain a separate Modified Scenarios section
    And the artifact does not contain a separate Deleted Scenarios section
```

## Consolidation

No existing scenarios in the test suite cover the plan skill's skip gate behavior or the integration-tester agent's consolidation, capability-grouping, test-depth, or artifact-restructuring behaviors. All coverage above is new.

The following existing scenarios remain accurate and require no changes:

- `cli/features/pipeline-happy-path.feature` — full epic lifecycle; not affected
- `cli/features/pipeline-error-resilience.feature` — dispatch failure paths; not affected
- `cli/features/validate-feedback-loop.feature` — regression re-dispatch; not affected
- `cli/features/hitl-hook-lifecycle.feature` — HITL settings per phase; not affected
- `cli/features/static-hitl-hooks.feature` — static hook behavior; not affected

No existing scenarios are stale or obsolete as a result of this epic.
