---
phase: plan
slug: d903e0
epic: static-hitl-hooks
feature: static-hitl-hooks
wave: 1
---

# Static HITL Hooks

**Design:** .beastmode/artifacts/design/2026-04-05-d903e0.md

## User Stories

1. As a user running a design phase, I want the HITL hook to defer questions to me without invoking an LLM, so that there's no unnecessary latency or model overhead when I've configured "always defer to human."

2. As a user running an implement phase, I want the HITL hook to auto-answer AskUserQuestion calls with my config prose as freeform "Other" text, so that the agent receives my instructions without model interpretation overhead.

3. As a developer, I want the hook builder to produce `type: "command"` entries instead of `type: "prompt"` entries for AskUserQuestion, so that the settings.local.json reflects the new static behavior.

## What to Build

### New Module: Static Auto-Answer Script

A standalone bun-executable TypeScript script that replaces the LLM prompt hook for AskUserQuestion decisions. The script:

- Receives the phase name as a CLI argument (same pattern as the existing PostToolUse logging script)
- Reads the beastmode config at runtime to extract the phase-specific HITL prose
- Implements a binary decision:
  - If prose equals "always defer to human": produce no output (silent pass-through defers to the human)
  - Otherwise: produce a JSON response that auto-answers every question in the tool input with answer="Other" and the prose text as freeform annotation notes
- Reads the tool input from the `$TOOL_INPUT` environment variable (standard Claude Code hook contract)
- The response format follows the Claude Code PreToolUse hook contract: `{"permissionDecision": "allow", "updatedInput": {...}}`

### Modified Module: Hook Builder

The existing hook builder function that produces PreToolUse entries for AskUserQuestion changes from emitting `type: "prompt"` entries (with an LLM prompt string) to emitting `type: "command"` entries (with a bun script invocation). The command targets the new auto-answer script with the phase name as argument.

The `buildPrompt()` function and all prompt template code for AskUserQuestion are deleted — the LLM is no longer in the decision loop. The `PromptHookEntry` type updates from `type: "prompt"` to `type: "command"` to reflect the new hook mechanism.

The `writeHitlSettings()` orchestration function continues to work as-is — it receives a hook entry from the builder and writes it to settings.local.json. The entry shape changes (command instead of prompt) but the write path is the same.

### Unchanged Modules

- **File-permission hooks** (`file-permission-settings.ts`): Stay prompt-based. LLM interpretation is still needed for prose-to-allow/deny/defer mapping.
- **PostToolUse logging** (`hitl-log.ts`): No changes. Already detects auto vs human from `input.answers` presence — the new auto-answer format (answer="Other" with annotation notes) is compatible with this detection.
- **Config schema** (`config.yaml`): No changes. The `hitl` section keeps the same structure. Prose values shift semantics from "LLM instructions" to "literal answer text" but existing values remain valid.

### Test Updates

- Unit tests for the new auto-answer script: verify defer output (no stdout) for "always defer to human", verify JSON output format for custom prose, verify all questions in input get answered
- Unit tests for the hook builder: verify it returns `type: "command"` entries targeting the new script with correct phase argument
- Existing prompt builder tests (`buildPrompt()` tests) are deleted alongside the function
- BDD step definitions that assert `type: "prompt"` for AskUserQuestion hooks update to assert `type: "command"` with phase argument verification

## Integration Test Scenarios

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

## Acceptance Criteria

- [ ] New `hitl-auto.ts` script exists and is bun-executable
- [ ] Script produces no output when prose is "always defer to human"
- [ ] Script produces valid JSON auto-answer when prose is anything else
- [ ] Auto-answer sets answer="Other" with prose text in annotation notes for every question in input
- [ ] `buildPreToolUseHook()` returns `type: "command"` entry targeting `hitl-auto.ts` with phase argument
- [ ] `buildPrompt()` function and all prompt template code for AskUserQuestion are deleted
- [ ] `PromptHookEntry` type reflects command type
- [ ] File-permission hooks remain unchanged (prompt-based)
- [ ] PostToolUse logging (`hitl-log.ts`) continues to work — detects auto vs human correctly
- [ ] Unit tests pass for new script and updated hook builder
- [ ] BDD scenarios pass with updated step definitions asserting command-type hooks
- [ ] settings.local.json contains command-type PreToolUse entry after phase dispatch
