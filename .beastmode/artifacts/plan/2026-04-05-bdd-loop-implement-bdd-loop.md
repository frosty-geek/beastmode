---
phase: plan
slug: bdd-loop
epic: bdd-loop
feature: implement-bdd-loop
wave: 1
---

# Implement BDD Loop

**Design:** `.beastmode/artifacts/design/2026-04-05-bdd-loop.md`

## User Stories

3. As a workflow user, I want implement to create the feature's integration test as Task 0 (from the Gherkin scenarios in the feature plan), starting in a RED state, so that I have a failing acceptance test before any implementation work begins.

4. As a workflow user, I want implement to re-run the feature's integration test after all tasks complete, so that I know whether the feature satisfies its acceptance criteria.

5. As a workflow user, I want implement to automatically analyze integration test failures, identify the responsible task, and re-dispatch it with failure context, so that broken features get fixed without manual intervention.

6. As a workflow user, I want the feature-level BDD retry loop to support model escalation (haiku→sonnet→opus, 2 attempts per tier, 6 total retries), so that stubborn failures get escalated to more capable models.

8. As a workflow user, I want integration tests to be identified by convention and BDD framework features (tags, groups, describe blocks) rather than a separate configuration, so that the test-to-feature mapping works with any test framework.

## What to Build

### Task 0 Pattern in Write Plan

The implement skill's Write Plan step (Phase 1, Step 0) gains a mandatory Task 0:

1. **Read the feature plan's `## Integration Test Scenarios` section** — extract the Gherkin scenarios
2. **Generate Task 0** as the first task in the write plan:
   - Task 0 creates a runnable integration test file from the Gherkin scenarios
   - The test must be runnable in isolation (feature-scoped, no cross-feature dependencies)
   - The test uses the project's existing test runner with naming convention for identification (e.g., `*.integration.test.ts` or `*.feature` depending on the project's BDD framework)
   - The test is expected to FAIL after Task 0 (RED state) — the feature isn't implemented yet
3. **All other tasks start at Task 1** — Task 0 is always the integration test, tasks 1-N are the implementation

### Convention-Based Test Discovery

Integration tests are identified by convention, not configuration:

- **File naming:** `<feature-name>.integration.test.ts` or `<feature-name>.feature`
- **Tags:** `@<epic-name>` on Gherkin features
- **Describe blocks:** feature name in the describe/feature block
- The implement skill uses these conventions to locate and run the correct integration test for a feature

### Feature-Level BDD Verification

After all implementation tasks (1-N) complete, add a new verification step before proceeding to checkpoint:

1. **Run the feature's integration test** — locate it by convention (Task 0 created it)
2. **If GREEN:** Feature satisfies its acceptance criteria. Proceed to checkpoint.
3. **If RED:** Enter the retry loop.

### Targeted Re-Dispatch with Failure Analysis

When the integration test fails after all tasks complete:

1. **Analyze the failure output** — examine test assertions, stack traces, and error messages
2. **Identify the responsible task** — map the failure to the most likely task based on:
   - Which task's files are referenced in the failure
   - Which task's acceptance criteria align with the failing assertion
   - Which task's implementation area covers the failing behavior
3. **Re-dispatch only that task** with the failure context appended:
   - Original task instructions
   - Integration test failure output
   - Failing test assertion details
4. **After re-dispatch completes:** re-run the integration test

### Model Escalation in BDD Retry Loop

The BDD retry loop reuses the existing model escalation infrastructure but applies it at the feature verification level:

- **Budget:** 6 total retries (2 per tier: haiku, sonnet, opus)
- **Escalation trigger:** integration test still fails after 2 attempts at current tier
- **Per-retry:** analyze failure → identify responsible task → re-dispatch at current model tier → re-run integration test
- **On success at any point:** stop retrying, feature is done
- **After 6 failures:** mark feature as failed, report to user

The escalation state is separate from the per-task escalation during initial implementation. The BDD retry loop's escalation applies to the re-dispatched task only.

### Escalation State Structure

The controller tracks two independent escalation contexts:

1. **Per-task escalation** (existing) — used during initial task dispatch in the wave loop
2. **BDD verification escalation** (new) — used during post-implementation integration test retries

Both use the same model ladder (`["haiku", "sonnet", "opus"]`) and the same 2-retries-per-tier budget, but they are independent counters.

## Integration Test Scenarios

```gherkin
@bdd-loop
Feature: Implement creates the integration test as Task 0 from Gherkin scenarios

  The implement phase reads the Gherkin scenarios from the feature plan
  and creates them as Task 0 -- the first task executed before any
  implementation work. Task 0 produces a runnable test that starts in
  a RED (failing) state, confirming the acceptance criteria are not yet
  satisfied.

  Scenario: Task 0 is created from the feature plan Gherkin section
    Given a feature plan with Gherkin integration scenarios
    When the implement phase begins for that feature
    Then Task 0 should be the first task dispatched
    And Task 0 should produce a runnable integration test from the Gherkin scenarios

  Scenario: Task 0 integration test starts in a RED state
    Given a feature plan with Gherkin integration scenarios
    When Task 0 completes
    Then the integration test should exist as a runnable test file
    And running the integration test should produce a failing result
    And the failing result should be recorded as the expected RED baseline

  Scenario: Implementation tasks begin only after Task 0 completes
    Given a feature plan with Gherkin integration scenarios and three implementation tasks
    When the implement phase begins
    Then Task 0 should complete before any implementation task is dispatched
```

```gherkin
@bdd-loop
Feature: Implement re-runs the integration test after all tasks complete

  After all implementation tasks for a feature complete, the implement
  phase re-runs the feature's integration test (created in Task 0) to
  verify whether the feature satisfies its acceptance criteria.

  Scenario: Integration test is re-run after the final implementation task
    Given a feature with Task 0 completed and all implementation tasks completed
    When the implement phase finishes the last implementation task
    Then the integration test should be executed again
    And the test result should be recorded

  Scenario: Passing integration test marks the feature as completed
    Given a feature whose implementation tasks are all completed
    When the post-implementation integration test passes
    Then the feature should be marked as completed
    And no retry should be triggered

  Scenario: Failing integration test triggers the retry loop
    Given a feature whose implementation tasks are all completed
    When the post-implementation integration test fails
    Then the feature should not be marked as completed
    And the failure analysis process should begin
```

```gherkin
@bdd-loop
Feature: Implement analyzes integration test failures and re-dispatches responsible tasks

  When the post-implementation integration test fails, the implement
  phase analyzes the failure output to identify which task is
  responsible. It then re-dispatches that specific task with the
  failure context appended, so the agent can fix the issue.

  Scenario: Failure analysis identifies the responsible task
    Given a feature with a failing integration test
    When the failure is analyzed
    Then exactly one task should be identified as the likely cause
    And the identification should be based on the test failure output

  Scenario: Responsible task is re-dispatched with failure context
    Given a feature with a failing integration test
    And the failure analysis identifies "task-3" as responsible
    When the task is re-dispatched
    Then "task-3" should receive the original task instructions
    And "task-3" should receive the integration test failure output
    And "task-3" should receive the failing test assertion details

  Scenario: Integration test is re-run after the re-dispatched task completes
    Given a re-dispatched task has completed its fix
    When the re-dispatched task finishes
    Then the integration test should be executed again
    And the new result should determine whether the feature passes or retries again
```

```gherkin
@bdd-loop
Feature: BDD retry loop supports model escalation across tiers

  The feature-level BDD retry loop escalates through model tiers
  when integration tests continue to fail. Each tier gets two
  attempts before escalation. The ladder is haiku, sonnet, opus
  for a total of six retries. If all six fail, the feature is
  marked as failed.

  Scenario Outline: Model escalation follows the tier ladder
    Given a feature with a persistently failing integration test
    And the retry loop has completed <previous_attempts> failed attempts
    When the next retry is dispatched
    Then the retry should use the "<model>" model tier

    Examples:
      | previous_attempts | model  |
      | 0                 | haiku  |
      | 1                 | haiku  |
      | 2                 | sonnet |
      | 3                 | sonnet |
      | 4                 | opus   |
      | 5                 | opus   |

  Scenario: First retry stays at the same model tier
    Given a feature that failed its integration test on the first haiku attempt
    When the retry loop dispatches the second attempt
    Then the model tier should still be haiku

  Scenario: Third failure escalates from haiku to sonnet
    Given a feature that has failed two haiku attempts
    When the retry loop dispatches the third attempt
    Then the model tier should be sonnet

  Scenario: Sixth failure exhausts all retries
    Given a feature that has failed all six attempts across all tiers
    When the retry loop checks for remaining retries
    Then the feature should be marked as failed
    And no further retries should be dispatched

  Scenario: Successful retry at any tier stops the escalation
    Given a feature that failed two haiku attempts
    When the sonnet-tier retry passes the integration test
    Then the feature should be marked as completed
    And no further retries should be dispatched
```

```gherkin
@bdd-loop
Feature: Integration tests are identified by convention and framework features

  Integration tests are identified by naming conventions and
  BDD framework features (tags, groups, describe blocks) rather
  than a separate configuration file. This allows the test-to-feature
  mapping to work with any test framework.

  Scenario: Integration test is identified by its tag matching the feature name
    Given a feature named "auth-provider"
    And an integration test file tagged with "auth-provider"
    When the implement phase looks up the integration test for "auth-provider"
    Then the test should be discovered by its tag

  Scenario: Integration test is identified by a describe block matching the feature name
    Given a feature named "token-cache"
    And an integration test with a describe block named "token-cache"
    When the implement phase looks up the integration test for "token-cache"
    Then the test should be discovered by its describe block name

  Scenario: Integration test is identified by file naming convention
    Given a feature named "login-flow"
    And an integration test file following the naming pattern for "login-flow"
    When the implement phase looks up the integration test for "login-flow"
    Then the test should be discovered by its file name

  Scenario: No separate configuration is required for test-to-feature mapping
    Given a feature with a conventionally named integration test
    When the implement phase resolves the test-to-feature mapping
    Then no external configuration file should be consulted
    And the mapping should rely solely on convention and framework features

  Scenario: Missing integration test for a feature is detected
    Given a feature named "orphan-feature" with no matching integration test
    When the implement phase looks up the integration test for "orphan-feature"
    Then a clear error should indicate that no integration test was found for "orphan-feature"
```

## Acceptance Criteria

- [ ] Write Plan always generates Task 0 as the integration test from the feature plan's Gherkin section
- [ ] Task 0 produces a runnable test file that fails (RED) before implementation
- [ ] All implementation tasks (1-N) dispatch after Task 0 completes
- [ ] After all tasks complete, the feature's integration test is re-run automatically
- [ ] If integration test passes, feature proceeds to checkpoint
- [ ] If integration test fails, failure output is analyzed to identify the responsible task
- [ ] The identified task is re-dispatched with failure context (original instructions + failure output + assertion details)
- [ ] After re-dispatch, integration test is re-run
- [ ] BDD retry loop supports 6 total retries: 2× haiku, 2× sonnet, 2× opus
- [ ] Escalation triggers after 2 failures at current tier
- [ ] Success at any retry stops the loop and marks feature as completed
- [ ] After 6 failures, feature is marked as failed with report to user
- [ ] Integration tests are discovered by convention (file naming, tags, describe blocks) — no config file
- [ ] BDD verification escalation state is independent from per-task escalation state
