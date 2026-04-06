---
phase: plan
slug: 8dbfd2
epic: integration-test-hygiene
feature: skip-gate
wave: 1
---

# Skip Gate

**Design:** `.beastmode/artifacts/design/2026-04-07-8dbfd2.md`

## User Stories

1. As a plan skill, I want to evaluate each feature's behavioral impact before dispatching the integration-tester agent, so that documentation-only changes, refactoring, configuration changes, and fixes with existing coverage skip integration test generation entirely.

## What to Build

Add a behavioral-change skip gate to the plan skill's integration test generation step (Execute phase, step 4). The gate evaluates each decomposed feature's behavioral impact using a heuristic applied to the PRD content and feature descriptions. Features that match skip criteria — documentation-only, refactoring/code cleanup, configuration changes, bug fixes with existing test coverage — are filtered out before agent dispatch.

The gate operates at two levels:

- **Full skip:** If all features in the epic match skip criteria, the entire agent dispatch is skipped. No integration artifact is produced. All feature plans receive empty Integration Test Scenarios sections.
- **Partial dispatch:** If some features are behavioral and others are not, only the behavioral features are sent to the agent. Non-behavioral features receive empty Integration Test Scenarios sections.

The classification is a heuristic evaluated from PRD content and feature descriptions — no explicit field in the PRD or feature metadata. The plan skill examines user story language for behavioral indicators (new user-facing behavior, changed interaction patterns, new error modes) versus non-behavioral indicators (restructuring, renaming, documentation updates, configuration changes, fixes to existing behavior already covered by tests).

When the skip gate fires for the full epic, the step 4b spawn is skipped entirely and step 4c distribution writes empty sections. The existing warn-and-continue handling for NEEDS_CONTEXT/BLOCKED agent statuses remains unchanged.

## Integration Test Scenarios

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

## Acceptance Criteria

- [ ] Plan skill evaluates behavioral impact of each feature before agent dispatch
- [ ] Documentation-only, refactoring, configuration, and bug-fix-with-coverage epics skip agent dispatch entirely
- [ ] Mixed epics send only behavioral features to the agent
- [ ] Full-skip epics produce no integration artifact and empty Integration Test Scenarios sections in all feature plans
- [ ] Existing warn-and-continue handling for agent failure is preserved
