---
phase: plan
type: integration
epic: static-hitl-hooks
---

# Integration Artifact: static-hitl-hooks

## New Scenarios

### Feature: static-hitl-hooks

Covers user stories [1, 2, 3].

```gherkin
@static-hitl-hooks
Feature: Static HITL hooks for AskUserQuestion

  The HITL PreToolUse hook for AskUserQuestion uses a static command script
  instead of an LLM prompt. The script reads config prose at runtime and
  either defers to the human (no output) or auto-answers with the prose
  as freeform "Other" text. The hook builder produces command-type entries
  in settings.local.json.

  Background:
    Given the initial epic slug is "static-hitl-epic"
    And a manifest is seeded for slug "static-hitl-epic"

  Scenario: Hook builder produces command-type entry for AskUserQuestion
    When the dispatch will write a design artifact:
      | field    | value         |
      | phase    | design        |
      | slug     | static-hitl   |
      | epic     | static-hitl   |
      | problem  | Test problem  |
      | solution | Test solution |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the AskUserQuestion PreToolUse hook should be command-type

  Scenario: Defer prose produces no output from the hook script
    Given the HITL config prose for "design" is "always defer to human"
    When the HITL auto hook runs for phase "design"
    Then the hook script should produce no output

  Scenario: Custom prose auto-answers with "Other" and the prose text
    Given the HITL config prose for "implement" is "approve all tool calls without asking"
    When the HITL auto hook runs for phase "implement"
    Then the hook script should produce a JSON response
    And the response should set the answer to "Other"
    And the response should include the prose in the annotation notes

  Scenario Outline: Defer-vs-auto-answer decision is purely based on prose value
    Given the HITL config prose for "<phase>" is "<prose>"
    When the HITL auto hook runs for phase "<phase>"
    Then the hook script should <behavior>

    Examples:
      | phase     | prose                               | behavior          |
      | design    | always defer to human               | produce no output |
      | plan      | always defer to human               | produce no output |
      | implement | approve all tool calls without asking | auto-answer       |
      | validate  | ask only about destructive actions   | auto-answer       |
      | release   | always defer to human               | produce no output |

  Scenario: Command-type hook includes phase argument
    When the dispatch will write plan artifacts:
      | feature | wave | description |
      | feat-1  | 1    | Feature 1   |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the AskUserQuestion PreToolUse hook should be command-type
    And the hook command should include the phase "plan" as an argument

  Scenario: File-permission hooks remain prompt-type alongside command-type HITL hooks
    Given the config has file-permissions claude-settings set to "auto-allow all changes"
    When the dispatch will write a design artifact:
      | field    | value         |
      | phase    | design        |
      | slug     | fp-coexist    |
      | epic     | fp-coexist    |
      | problem  | Test problem  |
      | solution | Test solution |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the AskUserQuestion PreToolUse hook should be command-type
    And the file-permission PreToolUse hook for "Write" should be prompt-type
```

## Modified Scenarios

### File: `cli/features/hitl-hook-lifecycle.feature`

#### Scenario: Plan phase has correct HITL settings with plan prose

**What changed:** The assertion `the worktree settings should contain a PreToolUse hook for "plan"` currently validates that the hook is `type: "prompt"` and that the prompt text contains the phase prose. With the switch to `type: "command"`, the step definition must assert `type: "command"` instead and verify the command targets the new `hitl-auto.ts` script with the correct phase argument. The prose is no longer embedded in the hook entry -- it is read at runtime by the script from config.yaml.

Updated Gherkin (complete scenario):

```gherkin
  Scenario: Plan phase has correct HITL settings with plan prose

    Given the initial epic slug is "hitl-epic"
    And a manifest is seeded for slug "hitl-epic"

    When the dispatch will write plan artifacts:
      | feature | wave | description |
      | feat-1  | 1    | Feature 1   |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the worktree settings should contain a command-type PreToolUse hook for "plan"
```

#### Scenario: HITL settings are phase-specific across consecutive phases

**What changed:** Same as above -- both assertions for design and plan hooks must validate `type: "command"` with the correct phase argument instead of `type: "prompt"` with embedded prose.

Updated Gherkin (complete scenario):

```gherkin
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
    And the worktree settings should contain a command-type PreToolUse hook for "design"

    When the dispatch will write plan artifacts:
      | feature | wave | description |
      | feat-1  | 1    | Feature 1   |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the worktree settings should contain a command-type PreToolUse hook for "plan"
```

#### Scenario: Custom settings survive HITL clean/write cycles

**What changed:** The PreToolUse assertion switches from prompt-type to command-type. No other changes -- the custom-settings preservation logic is unaffected.

Updated Gherkin (complete scenario):

```gherkin
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
    And the worktree settings should contain a command-type PreToolUse hook for "design"
    And the worktree settings should preserve custom setting "myCustom"
```

### File: `cli/features/file-permissions-hooks.feature`

#### Scenario: File-permission hooks coexist with HITL AskUserQuestion hooks

**What changed:** The assertion `the worktree settings should contain a PreToolUse hook for "design"` must switch to the command-type variant, since the HITL hook it coexists with is now command-type. File-permission hooks themselves remain prompt-type.

Updated Gherkin (complete scenario):

```gherkin
  Scenario: File-permission hooks coexist with HITL AskUserQuestion hooks

    When the dispatch will write a design artifact:
      | field    | value         |
      | phase    | design        |
      | slug     | fp-coexist    |
      | epic     | fp-coexist    |
      | problem  | Test problem  |
      | solution | Test solution |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the worktree settings should contain a command-type PreToolUse hook for "design"
    And the worktree settings should contain a file-permission PreToolUse hook for "Write"
    And the worktree settings should contain a file-permission PreToolUse hook for "Edit"
```

### File: `cli/features/file-permissions-lifecycle.feature`

#### Scenario: File permission hooks persist correct prose across design and plan phases

**What changed:** The HITL hook assertions at the end of each phase block switch from prompt-type to command-type. File-permission assertions are unchanged.

Updated Gherkin (complete scenario):

```gherkin
  Scenario: File permission hooks persist correct prose across design and plan phases

    Given the initial epic slug is "fp-lifecycle-epic"
    And a manifest is seeded for slug "fp-lifecycle-epic"
    And the config has file-permissions claude-settings set to "auto-allow plugin config writes"

    When the dispatch will write a design artifact:
      | field    | value              |
      | phase    | design             |
      | slug     | fp-lifecycle       |
      | epic     | fp-lifecycle       |
      | problem  | Test problem       |
      | solution | Test solution      |
    And the pipeline runs the "design" phase
    Then the pipeline result should be successful
    And the file-permission hook prompt should contain "auto-allow plugin config writes"
    And the worktree settings should contain a command-type PreToolUse hook for "design"

    When the dispatch will write plan artifacts:
      | feature | wave | description |
      | feat-1  | 1    | Feature 1   |
    And the pipeline runs the "plan" phase
    Then the pipeline result should be successful
    And the file-permission hook prompt should contain "auto-allow plugin config writes"
    And the worktree settings should contain a command-type PreToolUse hook for "plan"
```

## Deleted Scenarios

None. All existing scenarios remain valid after modification. No scenario becomes obsolete -- the behavioral intent (hooks are written, cleaned, and phase-specific) persists; only the hook type changes.
