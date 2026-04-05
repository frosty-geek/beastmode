@spring-cleaning
Feature: Project knowledge reflects simplified architecture

  Design docs, context tree entries, and L2/L3 knowledge files are
  updated to reflect the removal of cmux, SDK dispatch, and CLI
  watch/status commands. No stale references to removed capabilities
  remain in the knowledge base.

  Scenario: Design documentation does not reference cmux dispatch
    Given the project design documentation is reviewed
    When a reviewer searches for cmux references
    Then no cmux dispatch references are found

  Scenario: Design documentation does not reference SDK dispatch
    Given the project design documentation is reviewed
    When a reviewer searches for SDK dispatch references
    Then no SDK dispatch references are found

  Scenario: Context tree does not reference removed CLI commands
    Given the project context tree is reviewed
    When a reviewer searches for watch command references
    Then no watch command references are found in the context tree
    When a reviewer searches for status command references
    Then no status command references are found in the context tree

  Scenario: L2 and L3 knowledge files reflect current architecture
    Given the project knowledge hierarchy is reviewed
    When a reviewer checks L2 and L3 knowledge entries
    Then all dispatch-related entries describe iTerm2-only dispatch
    And no entries reference cmux, SDK, or removed CLI commands
