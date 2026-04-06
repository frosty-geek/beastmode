---
phase: plan
slug: 8dbfd2
epic: integration-test-hygiene
feature: agent-consolidation
wave: 1
---

# Agent Consolidation

**Design:** `.beastmode/artifacts/design/2026-04-07-8dbfd2.md`

## User Stories

2. As a plan-integration-tester agent, I want to review the full existing test suite for overlapping and stale scenarios on every run, so that the suite stays consolidated without requiring a separate periodic cleanup pass.

3. As a plan-integration-tester agent, I want to organize scenarios by capability domain rather than by originating feature, so that the test suite gives a holistic picture of what beastmode does instead of mirroring the feature decomposition tree.

4. As a plan-integration-tester agent, I want to prioritize happy-path scenarios and include error paths only when they represent high-risk user-visible behavior, so that the integration suite tests at the right level of the test pyramid.

5. As a plan-integration-tester agent, I want to produce a two-section artifact (New Scenarios + Consolidation) with both epic and capability tags, so that changes to existing scenarios are tracked alongside new additions in a single auditable document.

## What to Build

Upgrade the plan-integration-tester agent definition to add inline suite consolidation, capability-based organization, test-depth guidance, and a restructured artifact format.

**Consolidation:** The agent's analysis step expands beyond coverage checking for the current epic's user stories. On every invocation, the agent reviews the full existing test suite for overlapping scenarios (same behavioral intent covered by multiple scenarios, potentially from different epics) and stale scenarios (behavior that no longer exists or has been superseded). Consolidation actions — merge overlapping and remove stale — are described in the artifact alongside new scenarios. The agent's consolidation decisions are authoritative with no human review step.

**Capability-based organization:** New scenarios shift from per-feature grouping (headings matching input feature names) to capability-domain grouping (e.g., @pipeline, @dashboard, @release). A scenario may span multiple input features if it covers a capability that crosses feature boundaries. The agent determines capability domains from the existing test suite's natural groupings and the current epic's behavioral scope. Scenarios carry both an epic tag (@<epic-name>) for traceability and a capability tag (@<capability-domain>) for logical grouping.

**Test depth:** The agent prioritizes happy-path scenarios. Every capability domain touched by the epic gets at least one happy-path scenario representing a successful end-to-end flow. Error paths are included only when the agent judges them high-risk based on complexity and user-visible impact. No edge cases at the integration level — those belong in unit tests.

**Artifact restructuring:** The three-section format (New Scenarios, Modified Scenarios, Deleted Scenarios) becomes two sections: New Scenarios (unchanged purpose) and Consolidation (absorbs modified, deleted, and merged changes to existing scenarios). The Consolidation section describes each action with the original file path, the action taken (merge, update, or remove), and the reason. For merges and updates, the complete resulting Gherkin is included.

The plan skill's distribution logic (step 4c) continues to match `### Feature: <feature-name>` headings in the New Scenarios section. With capability-based grouping, the agent must still organize new scenarios under feature-name headings that match the input feature names, even though the Gherkin Feature blocks within use capability-domain names. This preserves the mechanical distribution contract between agent and skill.

## Integration Test Scenarios

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

## Acceptance Criteria

- [ ] Agent reviews full existing test suite for overlapping and stale scenarios on every invocation
- [ ] Overlapping scenarios (same behavioral intent) are merged into one canonical scenario in the Consolidation section
- [ ] Stale scenarios (obsolete behavior) are marked for removal in the Consolidation section
- [ ] New scenarios are organized by capability domain with capability tags (@<domain>) alongside epic tags (@<epic>)
- [ ] Every capability domain gets at least one happy-path scenario
- [ ] Error paths included only for high-risk user-visible behavior
- [ ] Artifact uses two-section format (New Scenarios + Consolidation) instead of three sections
- [ ] Feature-name headings in New Scenarios still match input feature names for mechanical distribution
