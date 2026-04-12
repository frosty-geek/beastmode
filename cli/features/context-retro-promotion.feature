@context
Feature: Context hierarchy loading and retro promotion

  Each phase session receives context from the L0-L2 knowledge
  hierarchy. After a phase completes, the retro walker may promote
  learnings upward -- from phase-specific L2 to cross-phase L1,
  and from L1 to L0 at release time. This feature tests the loading
  chain and upward promotion.

  Scenario: Phase session loads context from L0 through L2
    Given a project with the standard context hierarchy:
      | level | path                              | content                  |
      | L0    | .beastmode/BEASTMODE.md           | System manual            |
      | L1    | .beastmode/context/IMPLEMENT.md   | Implementation guidance  |
      | L2    | .beastmode/context/implement/     | Phase-specific knowledge |
    When the implement phase session starts for epic "widget-auth"
    Then the session context should include L0 content
    And the session context should include L1 implement content
    And the session context should include L2 implement knowledge

  Scenario: Design phase does not load implement-specific context
    Given a project with the standard context hierarchy:
      | level | path                              | content                  |
      | L0    | .beastmode/BEASTMODE.md           | System manual            |
      | L1    | .beastmode/context/DESIGN.md      | Design guidance          |
      | L1    | .beastmode/context/IMPLEMENT.md   | Implementation guidance  |
    When the design phase session starts for epic "widget-auth"
    Then the session context should include L0 content
    And the session context should include L1 design content
    And the session context should not include L1 implement content

  Scenario: Retro promotes high-confidence finding from L2 to L1
    Given a completed implement phase produced a retro finding:
      | finding                                         | confidence |
      | Always run caller-sweep grep between waves      | high       |
    When the retro walker evaluates the finding
    Then the finding should be promoted to L1 implement context
    And the L2 source should reference the promotion
