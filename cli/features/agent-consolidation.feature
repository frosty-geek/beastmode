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
