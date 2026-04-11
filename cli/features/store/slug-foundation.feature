@slug-id-consistency @store
Feature: Slug foundation -- bijection, placeholders, and deduplication

  The slug subsystem provides three guarantees:
  (1) hex suffixes encode entity IDs for collision-proof bijection,
  (2) design-phase epics get memorable placeholder names, and
  (3) all slug formatting flows through a single canonical module.

  Background:
    Given a store is initialized

  # --- Slug-ID bijection ---

  Scenario: Epic slug suffix matches the entity's short ID
    When a developer creates an epic named "auth system"
    Then the epic slug suffix should equal the first characters of the entity's hash ID
    And the entity should be retrievable by extracting the suffix from the slug

  Scenario: Entity ID is recoverable from the slug alone
    Given an epic exists with a known slug and hash ID
    When a developer extracts the hex suffix from the slug
    Then the extracted suffix should match the entity's short ID
    And the entity should be locatable by that short ID without a store query

  Scenario: Bijection holds across multiple epics
    When a developer creates epics named "auth system" and "data pipeline"
    Then each epic's slug suffix should match its own short ID
    And no two epics should share the same suffix

  # --- Placeholder names ---

  Scenario: New epic receives a memorable placeholder name
    When a developer generates a placeholder slug with short ID "a1b2"
    Then the placeholder slug should contain a human-readable word
    And the placeholder slug should not be a bare hex string

  Scenario: Placeholder name follows the adjective-noun-hex pattern
    When a developer generates a placeholder slug with short ID "c3d4"
    Then the placeholder slug should match the pattern adjective-noun-hex

  # --- Slugify deduplication ---

  Scenario: Slug formatting produces consistent output regardless of call site
    Given a raw name "My Epic Name!"
    When the slug is computed by the store module
    Then the result should be "my-epic-name"

  Scenario: Slug validation accepts dots for feature ID suffixes
    Given a feature slug containing a dot suffix like "auth-flow-a3f2.2"
    When the slug is validated
    Then the validation should pass

  Scenario: Double-hyphen separator is unambiguous
    Given a name containing double hyphens "foo--bar"
    When the name is slugified
    Then the result should be "foo-bar"
    And double hyphens should be impossible in slugified output
