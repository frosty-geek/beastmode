@manifest-absorption
Feature: Store schema supports feature slugs and slug utilities

  Features carry a slug field following the three-tier identity model
  (id, slug, name). The store provides slug normalization and
  deduplication so that human-readable identifiers are unique across
  all entities.

  Background:
    Given a store is initialized

  Scenario: Feature entity carries a slug field
    Given an epic "auth-system" exists in the store
    When a developer creates a feature "login-flow" under "auth-system" with slug "login-flow"
    Then the feature should have slug "login-flow"
    And the feature should be retrievable by slug "login-flow"

  Scenario: Slug is normalized to kebab-case
    Given an epic "auth-system" exists in the store
    When a developer creates a feature with raw slug "Login Flow!"
    Then the feature slug should be normalized to "login-flow"

  Scenario: Duplicate slug receives a disambiguating suffix
    Given an epic "auth-system" exists in the store
    And a feature with slug "login-flow" already exists
    When a developer creates another feature with slug "login-flow"
    Then the new feature slug should have a unique suffix appended
    And both features should be retrievable by their distinct slugs

  Scenario: Store is the sole pipeline state file
    Given a store contains epics with features, dependencies, and phase status
    When a developer inspects the pipeline state
    Then all pipeline state is contained in a single store file
    And no separate manifest files are required

  Scenario: Epic entity carries slug and name fields
    Given a store is initialized
    When a developer creates an epic with slug "manifest-absorption" and name "Manifest Absorption"
    Then the epic should have slug "manifest-absorption"
    And the epic should have name "Manifest Absorption"
    And the epic slug should be immutable after creation
