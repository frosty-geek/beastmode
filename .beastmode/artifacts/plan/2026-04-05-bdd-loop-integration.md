# BDD Loop -- Integration Test Artifact

Epic: **bdd-loop**
Date: 2026-04-05
User stories analyzed: 8

---

## New Scenarios

### Feature: Plan produces Gherkin integration scenarios

Covers user stories 1 and 2.

```gherkin
@bdd-loop
Feature: Plan produces Gherkin integration scenarios in feature plans

  The plan phase invokes the plan-integration-tester agent with all user
  stories from the PRD. The agent returns grouped per-feature Gherkin
  scenarios. Plan distributes these scenarios into the corresponding
  feature plans so each feature has acceptance criteria before
  implementation begins.

  Scenario: Plan phase includes Gherkin scenarios in each feature plan
    Given an epic with a PRD containing user stories
    When the plan phase completes
    Then each feature plan should contain a Gherkin integration test section
    And each Gherkin section should have at least one scenario

  Scenario: Integration tester receives all features in a single batch
    Given an epic with a PRD containing user stories for multiple features
    When the plan phase invokes the integration tester
    Then the integration tester should receive all features at once
    And the integration tester should return scenarios grouped by feature

  Scenario: Returned scenarios are distributed into correct feature plans
    Given an epic with features "auth-provider" and "token-cache"
    And the integration tester returns scenarios for both features
    When the plan phase distributes the scenarios
    Then the "auth-provider" feature plan should contain only its own scenarios
    And the "token-cache" feature plan should contain only its own scenarios

  Scenario: Feature plan without matching scenarios gets an empty test section
    Given an epic with a feature that has no behavioral user stories
    When the plan phase distributes the integration tester output
    Then that feature plan should contain an empty Gherkin section
    And a warning should be recorded for the missing coverage
```

### Feature: Implement creates integration test as Task 0

Covers user story 3.

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

### Feature: Implement re-runs integration test after all tasks

Covers user story 4.

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

### Feature: Implement auto-analyzes failures and re-dispatches tasks

Covers user story 5.

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

### Feature: BDD retry loop with model escalation

Covers user story 6.

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

### Feature: Validate re-dispatches failing features for re-implementation

Covers user story 7.

```gherkin
@bdd-loop
Feature: Validate re-dispatches failing features for full re-implement cycles

  When validation identifies failing features, the validate phase
  re-dispatches only those specific features for a complete
  re-implementation cycle (not a full epic regression). Each feature
  gets a maximum of two re-implement cycles. The inner BDD retry
  counter resets at the start of each new re-implement cycle.

  Scenario: Validate identifies and re-dispatches only the failing feature
    Given an epic with features "auth-provider" and "token-cache" both completed
    When the validate phase runs and "token-cache" fails validation
    Then only "token-cache" should be re-dispatched for re-implementation
    And "auth-provider" should retain its completed status

  Scenario: Re-dispatched feature gets a full re-implement cycle
    Given a feature "token-cache" that failed validation
    When "token-cache" is re-dispatched
    Then "token-cache" should go through the complete implement phase
    And the implement phase should include Task 0 integration test creation
    And the implement phase should include all implementation tasks
    And the implement phase should include the post-implementation test run

  Scenario: Inner retry counter resets on each re-implement cycle
    Given a feature that exhausted three retries in its first implement cycle
    When the feature is re-dispatched by validate for a second implement cycle
    Then the retry counter should start at zero
    And the model tier should start at haiku

  Scenario: Maximum of two re-implement cycles per feature
    Given a feature that has already been re-dispatched twice by validate
    When the feature fails validation a third time
    Then the feature should be marked as permanently failed
    And no further re-implement cycles should be dispatched

  Scenario: Successful re-implementation allows validate to proceed
    Given a feature re-dispatched by validate
    When the re-implementation succeeds and passes the integration test
    Then validate should re-run for the entire epic
    And the epic should advance past validation if all features pass
```

### Feature: Convention-based integration test identification

Covers user story 8.

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

---

## Modified Scenarios

### regression-loop.feature -- "Validate failure triggers regression, features reset, re-implement succeeds"

**File:** `/Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/bdd-loop/cli/features/regression-loop.feature`

**What changed:** The bdd-loop epic introduces feature-level re-dispatch on validation failure instead of resetting ALL features to pending. The existing regression-loop scenario resets every feature to pending and re-implements everything. Under the new model, only failing features are re-dispatched and passing features retain their completed status. The existing scenario's behavioral intent (validate failure triggers re-implementation) is still valid for the case where ALL features fail, but the "all features should have status pending" assertion needs to be conditional on which features actually failed.

**Why:** User story 7 explicitly states validate re-dispatches only failing features, not a blanket reset. The existing scenario assumes blanket reset which contradicts the new behavior.

**Updated Gherkin:**

```gherkin
Feature: Regression loop -- validate failure triggers targeted re-implement

  When validation fails, the validate phase identifies which specific
  features failed and re-dispatches only those features for
  re-implementation. Features that passed validation retain their
  completed status. The epic returns to the implement phase for the
  targeted features, then re-validates.

  Scenario: Validate failure triggers targeted re-implement of failing features only

    # -- Phase 1: Design with slug rename --
    Given the initial epic slug is "hex0a1b2c"
    And a manifest is seeded for slug "hex0a1b2c"

    When the dispatch will write a design artifact:
      | field    | value                           |
      | phase    | design                          |
      | slug     | hex0a1b2c                       |
      | epic     | auth-flow                       |
      | problem  | Complex OAuth integration       |
      | solution | Streamlined auth service        |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the manifest slug should be "auth-flow"
    And the manifest phase should be "plan"

    # -- Phase 2: Plan with multi-wave features --
    When the dispatch will write plan artifacts:
      | feature      | wave | description                |
      | oauth-server | 1    | OAuth2 provider setup      |
      | client-lib   | 1    | Client library integration |
      | token-cache  | 2    | Token caching layer        |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And the manifest should have 3 features
    And all features should have status "pending"

    # -- Phase 3a: Implement all features --
    When the dispatch will write an implement artifact for feature "oauth-server"
    And the pipeline runs the "implement" phase for feature "oauth-server"
    Then the pipeline result should be successful
    And feature "oauth-server" should have status "completed"

    When the dispatch will write an implement artifact for feature "client-lib"
    And the pipeline runs the "implement" phase for feature "client-lib"
    Then the pipeline result should be successful
    And feature "client-lib" should have status "completed"

    When the dispatch will write an implement artifact for feature "token-cache"
    And the pipeline runs the "implement" phase for feature "token-cache"
    Then the pipeline result should be successful
    And feature "token-cache" should have status "completed"
    And the manifest phase should be "validate"

    # -- Phase 4a: Validate with FAILURE targeting token-cache --
    When the dispatch will write a validate artifact with status "failed" for feature "token-cache"
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And feature "token-cache" should have status "pending"
    And feature "oauth-server" should have status "completed"
    And feature "client-lib" should have status "completed"

    # -- Phase 3b: Re-implement only the failing feature --
    When the dispatch will write an implement artifact for feature "token-cache"
    And the pipeline runs the "implement" phase for feature "token-cache"
    Then the pipeline result should be successful
    And feature "token-cache" should have status "completed"
    And the manifest phase should be "validate"

    # -- Phase 4b: Re-validate with SUCCESS --
    When the dispatch will write a validate artifact with status "passed"
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "release"

    # -- Phase 5: Release --
    When the dispatch will write a release artifact with bump "minor"
    And the pipeline runs the "release" phase
    Then the pipeline result should be successful
    And the manifest phase should be "done"
    And the worktree should be cleaned up
```

### pipeline-error-resilience.feature -- "Failed validate produces regression but pipeline succeeds"

**File:** `/Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/bdd-loop/cli/features/pipeline-error-resilience.feature`

**What changed:** The third scenario in this file asserts that a failed validate moves the manifest back to implement with all features implicitly reset. Under the new bdd-loop model, validate failure re-dispatches only failing features. The scenario needs to specify which feature failed validation.

**Why:** Same rationale as above -- user story 7 replaces blanket regression with targeted feature re-dispatch.

**Updated Gherkin:**

```gherkin
  Scenario: Failed validate produces targeted regression for failing feature

    Given the initial epic slug is "regress-epic"
    And a manifest is seeded for slug "regress-epic"

    # Must run design first so manifest transitions to plan phase
    When the dispatch will write a design artifact:
      | field    | value        |
      | phase    | design       |
      | slug     | regress-epic |
      | epic     | regress-epic |
      | problem  | Test problem |
      | solution | Test solution |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the manifest phase should be "plan"

    When the dispatch will write plan artifacts:
      | feature | wave | description    |
      | feat-a  | 1    | Feature A      |
      | feat-b  | 2    | Feature B      |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"

    # Implement feature-a
    When the dispatch will write an implement artifact for feature "feat-a"
    And the pipeline runs the "implement" phase for feature "feat-a"
    Then the pipeline result should be successful

    # Implement feature-b
    When the dispatch will write an implement artifact for feature "feat-b"
    And the pipeline runs the "implement" phase for feature "feat-b"
    Then the pipeline result should be successful
    And the manifest phase should be "validate"

    # Validate with failure targeting feat-b triggers targeted regression
    When the dispatch will write a validate artifact with status "failed" for feature "feat-b"
    And the pipeline runs the "validate" phase
    Then the pipeline result should be successful
    And the manifest phase should be "implement"
    And feature "feat-b" should have status "pending"
    And feature "feat-a" should have status "completed"
```

---

## Deleted Scenarios

None. All existing scenarios remain valid in their current form or are modified above to align with the new targeted regression model. No scenarios are made fully obsolete by the bdd-loop epic.

---
