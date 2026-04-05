---
phase: plan
slug: bdd-loop
epic: bdd-loop
feature: plan-inline-gherkin
wave: 1
---

# Plan Inline Gherkin

**Design:** `.beastmode/artifacts/design/2026-04-05-bdd-loop.md`

## User Stories

1. As a workflow user, I want plan to produce Gherkin integration test scenarios inline in each feature plan, so that every feature has a clear acceptance test before implementation begins.

2. As a workflow user, I want the plan-integration-tester agent to receive all features in a batch and return grouped per-feature scenarios, so that plan can distribute them into the correct feature plans efficiently.

## What to Build

### Plan Skill Changes

Rewrite the plan skill's integration test generation step (currently Phase 1, Step 4). The current flow spawns the plan-integration-tester agent with PRD user stories, receives a single integration artifact, then creates a dedicated Wave 1 "integration-tests" feature. The new flow:

1. **After feature decomposition** (Step 3), collect all features with their user stories
2. **Invoke the plan-integration-tester agent once** with the full feature list and their user stories as a batch
3. **Receive grouped output** — the agent returns Gherkin scenarios organized by feature name
4. **Distribute inline** — for each feature, inject the corresponding Gherkin scenarios into a `## Integration Test Scenarios` section in the feature plan document
5. **Remove the Wave 1 integration-tests feature generation** — no more dedicated integration feature, no wave bumping

The feature plan format gains a new optional section between "What to Build" and "Acceptance Criteria":

```markdown
## Integration Test Scenarios

​```gherkin
@<epic-name>
Feature: [descriptive feature name]

  Scenario: [behavioral description]
    Given [initial state]
    When [action]
    Then [expected outcome]
​```
```

If a feature has no matching scenarios from the agent, include an empty section with a comment noting no behavioral scenarios were produced.

### Plan-Integration-Tester Agent Changes

Update the agent's input contract:

- **Current:** receives epic name + PRD user stories (flat list)
- **New:** receives epic name + a list of features, each with its name and associated user stories

Update the agent's output contract:

- **Current:** produces a single integration artifact with New/Modified/Deleted sections
- **New:** produces the same artifact structure, but the New Scenarios section is organized with clear feature-name headers so the plan skill can mechanically distribute them

The agent's Gherkin style rules, status reporting, and constraints remain unchanged.

### Artifact Continuity

The agent still writes to `.beastmode/artifacts/plan/YYYY-MM-DD-<epic-name>-integration.md` as a reference artifact. The plan skill reads this artifact and distributes its contents into feature plans. The integration artifact remains as an audit trail.

## Integration Test Scenarios

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

## Acceptance Criteria

- [ ] Plan skill invokes plan-integration-tester with all features in a single batch call
- [ ] Agent receives features with their associated user stories (not flat PRD story list)
- [ ] Agent output groups scenarios by feature name with clear headers
- [ ] Plan skill distributes agent's per-feature scenarios into each feature plan's `## Integration Test Scenarios` section
- [ ] The dedicated Wave 1 "integration-tests" feature is no longer generated
- [ ] Wave bumping logic (incrementing other features' waves) is removed
- [ ] Feature plans without matching scenarios get an empty integration test section with a note
- [ ] The integration artifact is still written as an audit trail
- [ ] Plan-integration-tester agent definition is updated with the new input/output contract
