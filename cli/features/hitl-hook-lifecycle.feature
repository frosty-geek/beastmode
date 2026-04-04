Feature: HITL hook lifecycle -- settings written before dispatch, cleaned between phases

  The pipeline writes HITL settings (PreToolUse prompt hook + PostToolUse log hook)
  to the worktree's `.claude/settings.local.json` before dispatch, and cleans them
  between dispatches.

  Pipeline step 3 does:
  1. cleanHitlSettings(claudeDir) — removes old HITL hooks
  2. getPhaseHitlProse(config.hitl, phase) — gets prose for current phase
  3. buildPreToolUseHook(prose, model, timeout) — builds hook entry
  4. writeHitlSettings({claudeDir, preToolUseHook, phase}) — writes to settings.local.json

  This feature verifies:
  - HITL settings exist during dispatch for each phase
  - Settings contain correct phase-specific prose
  - Settings are cleaned and rewritten between consecutive phases
  - Non-HITL settings survive the clean/write cycles

  Scenario: Plan phase has correct HITL settings with plan prose

    Given the initial epic slug is "hitl-epic"
    And a manifest is seeded for slug "hitl-epic"

    When the dispatch will write plan artifacts:
      | feature | wave | description |
      | feat-1  | 1    | Feature 1   |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the worktree settings should contain a PreToolUse hook for "plan"


  Scenario: HITL settings are phase-specific across consecutive phases

    Given the initial epic slug is "phase-specific-epic"
    And a manifest is seeded for slug "phase-specific-epic"

    When the dispatch will write a design artifact:
      | field    | value           |
      | phase    | design          |
      | slug     | phase-specific  |
      | epic     | phase-specific  |
      | problem  | Test problem    |
      | solution | Test solution   |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the worktree settings should contain a PreToolUse hook for "design"

    When the dispatch will write plan artifacts:
      | feature | wave | description |
      | feat-1  | 1    | Feature 1   |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the worktree settings should contain a PreToolUse hook for "plan"


  Scenario: Custom settings survive HITL clean/write cycles

    Given the initial epic slug is "custom-settings-epic"
    And a manifest is seeded for slug "custom-settings-epic"
    And the worktree has a custom setting "myCustom" with value "preserved"

    When the dispatch will write a design artifact:
      | field    | value        |
      | phase    | design       |
      | slug     | custom       |
      | epic     | custom       |
      | problem  | Test problem |
      | solution | Test solution |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the worktree settings should preserve custom setting "myCustom"
