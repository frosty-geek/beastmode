---
phase: plan
slug: bdd-loop
epic: bdd-loop
feature: validate-feedback-loop
wave: 1
---

# Validate Feedback Loop

**Design:** `.beastmode/artifacts/design/2026-04-05-bdd-loop.md`

## User Stories

7. As a workflow user, I want validate to automatically re-dispatch failing features for a full re-implement cycle (max 2 per feature), resetting the inner retry counter each time, so that cross-feature integration failures get resolved without manual intervention.

## What to Build

### Validate Skill — Feature-Level Failure Identification

After running the test suite in Phase 1, the validate skill gains the ability to identify which specific features failed:

1. **Run all integration tests** as part of the existing test gate
2. **Map failures to features** — use the convention-based test-to-feature mapping (same conventions the implement skill uses: file naming, tags, describe blocks) to determine which features have failing integration tests
3. **Separate passing from failing** — maintain a list of features that passed validation and features that failed

### Validate Skill — Re-Dispatch Loop

When validation identifies failing features, instead of halting with a FAIL status:

1. **Check re-dispatch budget** — each feature has a maximum of 2 re-dispatch cycles. Track how many times each feature has been re-dispatched in the current validation session.
2. **For each failing feature within budget:**
   - Re-dispatch the feature for a full implement cycle (equivalent to invoking `/implement` for that feature)
   - The re-implement cycle is a complete fresh cycle: new write plan, all tasks, Task 0 integration test, the full BDD verification loop
   - The inner BDD retry counter resets to 0 at the start of each re-implement cycle, giving a fresh 6 inner retries
   - The model escalation tier resets to haiku
3. **After re-implementation completes:** re-run validation for the entire epic (all features)
4. **If a feature exceeds its 2 re-dispatch budget:** mark it as permanently failed, report to user

### Re-Dispatch Budget Tracking

The validate skill tracks per-feature re-dispatch counts:

- **Initial validation:** all features at 0 re-dispatches
- **After first re-dispatch cycle:** failing feature at 1
- **After second re-dispatch cycle:** failing feature at 2
- **Third failure:** feature is permanently failed — budget exhausted

Theoretical maximum per feature: 3 implement cycles × 6 inner retries = 18 total attempts before hard stop.

### Modified Existing Scenarios

Two existing `.feature` files need modification to align with targeted re-dispatch:

1. **regression-loop.feature** — currently asserts blanket reset of all features on validate failure. Must change to assert only failing features are re-dispatched while passing features retain completed status.

2. **pipeline-error-resilience.feature** — third scenario asserts implicit all-feature reset. Must change to assert targeted feature re-dispatch with other features retaining status.

These modifications are part of this feature's implementation scope since they test validate behavior.

### Checkpoint Behavior Changes

The validate skill's checkpoint (Phase 3) gains conditional behavior:

- **All features pass (including after re-dispatch):** PASS — commit and handoff to release
- **Any feature permanently failed (budget exhausted):** FAIL — report which features failed and how many cycles were attempted
- **Re-dispatch in progress:** do not checkpoint — loop back to implement for failing features, then re-validate

## Integration Test Scenarios

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

## Acceptance Criteria

- [ ] Validate identifies which specific features have failing integration tests (not just pass/fail for the whole suite)
- [ ] Failing features are re-dispatched for a full re-implement cycle (fresh write plan, all tasks, Task 0, BDD verification)
- [ ] Passing features retain their completed status — no blanket reset
- [ ] Each feature has a maximum of 2 re-dispatch cycles
- [ ] Inner BDD retry counter resets to 0 at the start of each re-implement cycle
- [ ] Model escalation tier resets to haiku at the start of each re-implement cycle
- [ ] After re-implementation, validate re-runs for the entire epic
- [ ] Features exceeding their 2 re-dispatch budget are marked as permanently failed
- [ ] Existing regression-loop.feature scenario is updated to assert targeted re-dispatch
- [ ] Existing pipeline-error-resilience.feature scenario is updated to assert targeted re-dispatch
- [ ] Validate reports which features failed and how many cycles were attempted
