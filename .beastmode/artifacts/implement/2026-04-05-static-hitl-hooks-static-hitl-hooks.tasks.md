# Static HITL Hooks — Implementation Tasks

## Goal

Replace the prompt-based AskUserQuestion PreToolUse hook with a static command hook (bun TypeScript script). The script reads `.beastmode/config.yaml` at runtime, extracts the phase prose, and either defers (no output) or auto-answers every question with answer="Other" and the prose text in annotation notes.

## Architecture

- **Hook type change**: `buildPreToolUseHook()` returns `type: "command"` with `bun run hitl-auto.ts <phase>` instead of `type: "prompt"` with an LLM prompt
- **New script**: `cli/src/hooks/hitl-auto.ts` — static auto-answering, reads config at runtime
- **Deleted code**: `buildPrompt()` function and all prompt template code in `hitl-settings.ts`
- **Type update**: `PromptHookEntry` changes from `type: "prompt"` to `type: "command"`
- **Unchanged**: file-permission hooks (prompt-based), PostToolUse logging (`hitl-log.ts`), config schema

## Tech Stack

- Bun + TypeScript
- Vitest for unit tests
- Cucumber.js for BDD integration tests

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/hooks/hitl-auto.ts` | Create | Static auto-answer script — reads config, defers or auto-answers |
| `cli/src/hooks/hitl-settings.ts` | Modify | Delete `buildPrompt()`, change `buildPreToolUseHook()` to return command-type, update `PromptHookEntry` type |
| `cli/src/pipeline/runner.ts` | Modify | Update `buildPreToolUseHook()` call site — pass phase instead of prose+timeout |
| `cli/src/commands/phase.ts` | Modify | Update `buildPreToolUseHook()` call site — pass phase instead of prose+timeout |
| `cli/src/__tests__/hitl-auto.test.ts` | Create | Unit tests for the new auto-answer script |
| `cli/src/__tests__/hitl-prompt.test.ts` | Modify | Delete prompt tests, replace with command-type tests for `buildPreToolUseHook()` |
| `cli/src/__tests__/hitl-settings.test.ts` | Modify | Update mock PreToolUse hook to use command type |
| `cli/src/__tests__/reconciling-factory-cleanup.test.ts` | Modify | Update `buildPreToolUseHook` mock signature |
| `cli/features/hitl-hook-lifecycle.feature` | Modify | Update step assertions from prompt-type to command-type |
| `cli/features/file-permissions-hooks.feature` | Modify | Update coexistence scenario to use command-type assertion |
| `cli/features/file-permissions-lifecycle.feature` | Modify | Update HITL hook assertions to command-type |
| `cli/features/step_definitions/hitl.steps.ts` | Modify | Add command-type assertion step, update existing steps |

---

### Task 0: Integration Test (BDD)

**Wave:** 0
**Depends on:** -

**Files:**
- Create: `cli/features/static-hitl-hooks.feature`
- Create: `cli/features/step_definitions/static-hitl-hooks.steps.ts`

- [ ] **Step 1: Create the integration test feature file**

```gherkin
# cli/features/static-hitl-hooks.feature
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
      | phase     | prose                                | behavior          |
      | design    | always defer to human                | produce no output |
      | plan      | always defer to human                | produce no output |
      | implement | approve all tool calls without asking | auto-answer       |
      | validate  | ask only about destructive actions    | auto-answer       |
      | release   | always defer to human                | produce no output |

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

- [ ] **Step 2: Create the step definitions for the new scenarios**

```typescript
// cli/features/step_definitions/static-hitl-hooks.steps.ts
import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execSync } from "node:child_process";
import type { PipelineWorld } from "../support/world.js";

/** Get the actual worktree settings path. */
function getWorktreeSettingsPath(world: PipelineWorld): string {
  const wtPath = resolve(world.projectRoot, ".claude", "worktrees", world.epicSlug);
  return join(wtPath, ".claude", "settings.local.json");
}

// -- Given: HITL config prose setup --

Given("the HITL config prose for {string} is {string}", function (
  this: PipelineWorld,
  phase: string,
  prose: string,
) {
  // Rewrite config.yaml with the specified prose for the given phase
  const configPath = join(this.projectRoot, ".beastmode", "config.yaml");
  const configContent = readFileSync(configPath, "utf-8");

  // Update the hitl section for this phase
  const lines = configContent.split("\n");
  const newLines: string[] = [];
  let inHitl = false;
  let updated = false;

  for (const line of lines) {
    if (line.match(/^hitl:/)) {
      inHitl = true;
      newLines.push(line);
      continue;
    }
    if (inHitl && line.match(new RegExp(`^\\s+${phase}:`))) {
      newLines.push(`  ${phase}: "${prose}"`);
      updated = true;
      continue;
    }
    if (inHitl && !line.startsWith(" ") && line.length > 0) {
      inHitl = false;
    }
    newLines.push(line);
  }

  if (!updated) {
    // Phase key not found — add it under hitl
    const hitlIdx = newLines.findIndex((l) => l.match(/^hitl:/));
    if (hitlIdx >= 0) {
      newLines.splice(hitlIdx + 1, 0, `  ${phase}: "${prose}"`);
    }
  }

  writeFileSync(configPath, newLines.join("\n"));

  // Store for later assertions
  (this as any)._hitlAutoPhase = phase;
  (this as any)._hitlAutoProse = prose;
});

// -- When: run the hook script directly --

When("the HITL auto hook runs for phase {string}", function (
  this: PipelineWorld,
  phase: string,
) {
  // Build a mock TOOL_INPUT with a sample question
  const toolInput = JSON.stringify({
    questions: [
      {
        question: "Which approach should we use?",
        header: "Approach",
        options: [
          { label: "Option A", description: "First option" },
          { label: "Option B", description: "Second option" },
        ],
        multiSelect: false,
      },
    ],
  });

  // Run hitl-auto.ts directly with the phase argument
  const scriptPath = resolve(this.projectRoot, "cli", "src", "hooks", "hitl-auto.ts");

  try {
    const result = execSync(`bun run "${scriptPath}" ${phase}`, {
      encoding: "utf-8",
      cwd: this.projectRoot,
      env: {
        ...process.env,
        TOOL_INPUT: toolInput,
      },
      timeout: 10000,
    });
    (this as any)._hookOutput = result;
  } catch (err: any) {
    // Script may exit 0 with no output — that's the defer case
    (this as any)._hookOutput = err.stdout ?? "";
  }
});

// -- Then: hook output assertions --

Then("the hook script should produce no output", function (this: PipelineWorld) {
  const output = ((this as any)._hookOutput ?? "").trim();
  assert.strictEqual(output, "", `Expected no output but got: ${output}`);
});

Then("the hook script should produce a JSON response", function (this: PipelineWorld) {
  const output = ((this as any)._hookOutput ?? "").trim();
  assert.ok(output.length > 0, "Expected JSON output but got empty string");

  let parsed: any;
  try {
    parsed = JSON.parse(output);
  } catch {
    assert.fail(`Expected valid JSON but got: ${output}`);
  }

  assert.ok(parsed.permissionDecision === "allow", "Expected permissionDecision=allow");
  assert.ok(parsed.updatedInput, "Expected updatedInput in response");
  (this as any)._hookParsedOutput = parsed;
});

Then("the hook script should auto-answer", function (this: PipelineWorld) {
  const output = ((this as any)._hookOutput ?? "").trim();
  assert.ok(output.length > 0, "Expected auto-answer output but got empty string");
  let parsed: any;
  try {
    parsed = JSON.parse(output);
  } catch {
    assert.fail(`Expected valid JSON but got: ${output}`);
  }
  assert.ok(parsed.permissionDecision === "allow", "Expected permissionDecision=allow");
  assert.ok(parsed.updatedInput, "Expected updatedInput in response");
});

Then("the response should set the answer to {string}", function (
  this: PipelineWorld,
  expectedAnswer: string,
) {
  const parsed = (this as any)._hookParsedOutput;
  assert.ok(parsed, "No parsed output available");

  const answers = parsed.updatedInput?.answers;
  assert.ok(answers, "No answers in updatedInput");

  // Check that at least one answer is set to the expected value
  const values = Object.values(answers) as string[];
  assert.ok(
    values.some((v) => v === expectedAnswer),
    `Expected at least one answer to be "${expectedAnswer}", got: ${JSON.stringify(answers)}`,
  );
});

Then("the response should include the prose in the annotation notes", function (
  this: PipelineWorld,
) {
  const parsed = (this as any)._hookParsedOutput;
  assert.ok(parsed, "No parsed output available");

  const prose = (this as any)._hitlAutoProse;
  assert.ok(prose, "No prose stored from Given step");

  const annotations = parsed.updatedInput?.annotations;
  assert.ok(annotations, "No annotations in updatedInput");

  // Check that at least one annotation has the prose in notes
  const notesValues = Object.values(annotations).map((a: any) => a.notes);
  assert.ok(
    notesValues.some((n) => n === prose),
    `Expected annotation notes to include "${prose}", got: ${JSON.stringify(annotations)}`,
  );
});

// -- Then: settings.local.json hook type assertions --

Then("the AskUserQuestion PreToolUse hook should be command-type", function (
  this: PipelineWorld,
) {
  const settingsPath = getWorktreeSettingsPath(this);
  assert.ok(existsSync(settingsPath), `Settings file does not exist at ${settingsPath}`);

  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  assert.ok(settings.hooks?.PreToolUse, "No PreToolUse hooks in settings");

  const hitlEntry = settings.hooks.PreToolUse.find(
    (entry: any) => entry.matcher === "AskUserQuestion",
  );
  assert.ok(hitlEntry, "No PreToolUse hook found for AskUserQuestion");

  const commandHook = hitlEntry.hooks.find((h: any) => h.type === "command");
  assert.ok(commandHook, "Expected command-type hook but found none");
  assert.ok(commandHook.command, "Command hook has no command field");
  assert.ok(
    commandHook.command.includes("hitl-auto.ts"),
    `Command should reference hitl-auto.ts, got: ${commandHook.command}`,
  );
});

Then("the hook command should include the phase {string} as an argument", function (
  this: PipelineWorld,
  phase: string,
) {
  const settingsPath = getWorktreeSettingsPath(this);
  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));

  const hitlEntry = settings.hooks.PreToolUse.find(
    (entry: any) => entry.matcher === "AskUserQuestion",
  );
  const commandHook = hitlEntry.hooks.find((h: any) => h.type === "command");
  assert.ok(
    commandHook.command.includes(phase),
    `Command should include phase "${phase}", got: ${commandHook.command}`,
  );
});

Then("the file-permission PreToolUse hook for {string} should be prompt-type", function (
  this: PipelineWorld,
  tool: string,
) {
  const settingsPath = getWorktreeSettingsPath(this);
  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  assert.ok(settings.hooks?.PreToolUse, "No PreToolUse hooks in settings");

  const fpEntry = settings.hooks.PreToolUse.find(
    (entry: any) => entry.matcher === tool,
  );
  assert.ok(fpEntry, `No PreToolUse hook found for ${tool}`);

  const promptHook = fpEntry.hooks.find((h: any) => h.type === "prompt");
  assert.ok(promptHook, `Expected prompt-type hook for ${tool} but found none`);
});

- [ ] **Step 3: Run the integration test to verify RED state**

Run: `cd cli && bun run cucumber --tags @static-hitl-hooks 2>&1 | tail -20`
Expected: FAIL — hitl-auto.ts does not exist yet, step definitions reference missing code

- [ ] **Step 4: Commit**

```bash
git add cli/features/static-hitl-hooks.feature cli/features/step_definitions/static-hitl-hooks.steps.ts
git commit -m "test(static-hitl-hooks): add BDD integration tests for static HITL hooks"
```

---

### Task 1: Create hitl-auto.ts Script

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/src/hooks/hitl-auto.ts`
- Create: `cli/src/__tests__/hitl-auto.test.ts`

- [ ] **Step 1: Write the unit tests for the auto-answer script**

```typescript
// cli/src/__tests__/hitl-auto.test.ts
import { describe, test, expect } from "vitest";

/**
 * Import the core logic functions from hitl-auto.ts.
 * The script exports these for testability while also having a CLI entry point.
 */
import { decideResponse } from "../hooks/hitl-auto";

describe("decideResponse", () => {
  const sampleInput = {
    questions: [
      {
        question: "Which approach should we use?",
        header: "Approach",
        options: [
          { label: "Option A", description: "First option" },
          { label: "Option B", description: "Second option" },
        ],
        multiSelect: false,
      },
    ],
  };

  test("returns null for 'always defer to human' prose", () => {
    const result = decideResponse("always defer to human", JSON.stringify(sampleInput));
    expect(result).toBeNull();
  });

  test("returns JSON response for non-defer prose", () => {
    const result = decideResponse("approve all tool calls without asking", JSON.stringify(sampleInput));
    expect(result).not.toBeNull();

    const parsed = JSON.parse(result!);
    expect(parsed.permissionDecision).toBe("allow");
    expect(parsed.updatedInput).toBeDefined();
  });

  test("auto-answer sets answer to 'Other' for each question", () => {
    const result = decideResponse("approve everything", JSON.stringify(sampleInput));
    const parsed = JSON.parse(result!);

    expect(parsed.updatedInput.answers["Which approach should we use?"]).toBe("Other");
  });

  test("auto-answer includes prose in annotation notes for each question", () => {
    const prose = "approve everything";
    const result = decideResponse(prose, JSON.stringify(sampleInput));
    const parsed = JSON.parse(result!);

    expect(parsed.updatedInput.annotations["Which approach should we use?"].notes).toBe(prose);
  });

  test("handles multiple questions", () => {
    const multiInput = {
      questions: [
        {
          question: "Question 1?",
          options: [{ label: "A", description: "A" }],
          multiSelect: false,
        },
        {
          question: "Question 2?",
          options: [{ label: "B", description: "B" }],
          multiSelect: false,
        },
      ],
    };

    const result = decideResponse("auto-answer all", JSON.stringify(multiInput));
    const parsed = JSON.parse(result!);

    expect(parsed.updatedInput.answers["Question 1?"]).toBe("Other");
    expect(parsed.updatedInput.answers["Question 2?"]).toBe("Other");
    expect(parsed.updatedInput.annotations["Question 1?"].notes).toBe("auto-answer all");
    expect(parsed.updatedInput.annotations["Question 2?"].notes).toBe("auto-answer all");
  });

  test("returns null for empty prose (falls back to defer)", () => {
    const result = decideResponse("", JSON.stringify(sampleInput));
    expect(result).toBeNull();
  });

  test("returns null for invalid JSON input", () => {
    const result = decideResponse("approve all", "not json");
    expect(result).toBeNull();
  });

  test("returns null for input with no questions", () => {
    const result = decideResponse("approve all", JSON.stringify({ questions: [] }));
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun run test -- --run src/__tests__/hitl-auto.test.ts 2>&1 | tail -20`
Expected: FAIL — hitl-auto.ts does not exist

- [ ] **Step 3: Create the hitl-auto.ts script**

```typescript
// cli/src/hooks/hitl-auto.ts
#!/usr/bin/env bun
/**
 * hitl-auto.ts — PreToolUse command hook for AskUserQuestion.
 *
 * Static auto-answering script that replaces the LLM prompt hook.
 * Reads .beastmode/config.yaml at runtime, extracts phase prose, and either:
 * - Defers (no output) when prose is "always defer to human"
 * - Auto-answers every question with answer="Other" and prose in annotation notes
 *
 * Exits 0 always — hook failure must never block Claude.
 */

import { execSync } from "node:child_process";
import { loadConfig } from "../config.js";
import { getPhaseHitlProse } from "./hitl-settings.js";

// --- Core logic (exported for testing) ---

/**
 * Decide whether to auto-answer or defer, and return the response JSON string.
 * Returns null for defer (no output), or a JSON string for auto-answer.
 */
export function decideResponse(prose: string, rawToolInput: string): string | null {
  // Defer if prose is empty or explicitly "always defer to human"
  if (!prose || prose === "always defer to human") {
    return null;
  }

  let input: { questions?: Array<{ question: string }> };
  try {
    input = JSON.parse(rawToolInput);
  } catch {
    return null;
  }

  if (!input.questions || input.questions.length === 0) {
    return null;
  }

  // Build auto-answer response
  const answers: Record<string, string> = {};
  const annotations: Record<string, { notes: string }> = {};

  for (const q of input.questions) {
    answers[q.question] = "Other";
    annotations[q.question] = { notes: prose };
  }

  return JSON.stringify({
    permissionDecision: "allow",
    updatedInput: {
      ...input,
      answers,
      annotations,
    },
  });
}

// --- CLI entry point ---

if (import.meta.main) {
  try {
    const phase = process.argv[2];
    if (!phase) {
      process.exit(0);
    }

    const rawToolInput = process.env.TOOL_INPUT;
    if (!rawToolInput) {
      process.exit(0);
    }

    // Discover project root and load config
    const repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
    }).trim();
    const config = loadConfig(repoRoot);
    const prose = getPhaseHitlProse(config.hitl, phase);

    const response = decideResponse(prose, rawToolInput);
    if (response) {
      process.stdout.write(response);
    }
    // No output = defer to human
  } catch {
    // Silent exit — hook failure must never block Claude
  }
  process.exit(0);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun run test -- --run src/__tests__/hitl-auto.test.ts 2>&1 | tail -20`
Expected: PASS — all decideResponse tests green

- [ ] **Step 5: Commit**

```bash
git add cli/src/hooks/hitl-auto.ts cli/src/__tests__/hitl-auto.test.ts
git commit -m "feat(static-hitl-hooks): add hitl-auto.ts static auto-answer script"
```

---

### Task 2: Modify Hook Builder and Type

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `cli/src/hooks/hitl-settings.ts`
- Modify: `cli/src/__tests__/hitl-prompt.test.ts`
- Modify: `cli/src/__tests__/hitl-settings.test.ts`

- [ ] **Step 1: Update tests to expect command-type hooks**

In `cli/src/__tests__/hitl-prompt.test.ts`, replace all `buildPreToolUseHook` tests to verify command-type behavior:

```typescript
// cli/src/__tests__/hitl-prompt.test.ts
import { describe, test, expect } from "vitest";
import { buildPreToolUseHook, getPhaseHitlProse } from "../hooks/hitl-settings";
import type { HitlConfig } from "../config";

describe("buildPreToolUseHook", () => {
  test("returns entry targeting AskUserQuestion", () => {
    const entry = buildPreToolUseHook("design");
    expect(entry.matcher).toBe("AskUserQuestion");
    expect(entry.hooks).toHaveLength(1);
    expect(entry.hooks[0].type).toBe("command");
  });

  test("command references hitl-auto.ts", () => {
    const entry = buildPreToolUseHook("design");
    expect(entry.hooks[0].command).toContain("hitl-auto.ts");
  });

  test("command includes phase argument", () => {
    const entry = buildPreToolUseHook("implement");
    expect(entry.hooks[0].command).toContain("implement");
  });

  test("command uses bun run", () => {
    const entry = buildPreToolUseHook("plan");
    expect(entry.hooks[0].command).toContain("bun run");
  });

  test("command uses git rev-parse for repo root", () => {
    const entry = buildPreToolUseHook("validate");
    expect(entry.hooks[0].command).toContain("git rev-parse --show-toplevel");
  });

  test("does not contain prompt field", () => {
    const entry = buildPreToolUseHook("design");
    expect(entry.hooks[0]).not.toHaveProperty("prompt");
  });

  test("does not contain timeout field", () => {
    const entry = buildPreToolUseHook("design");
    expect(entry.hooks[0]).not.toHaveProperty("timeout");
  });
});

describe("getPhaseHitlProse", () => {
  const defaultConfig: HitlConfig = {
    design: "always defer to human",
    plan: "auto-approve feature ordering",
    implement: "approve all architectural decisions",
    validate: undefined,
    release: "",
    timeout: 30,
  };

  test("returns configured prose for phase", () => {
    expect(getPhaseHitlProse(defaultConfig, "plan")).toBe("auto-approve feature ordering");
  });

  test("returns default prose for undefined phase", () => {
    expect(getPhaseHitlProse(defaultConfig, "validate")).toBe("always defer to human");
  });

  test("returns default prose for empty string phase", () => {
    expect(getPhaseHitlProse(defaultConfig, "release")).toBe("always defer to human");
  });

  test("returns default prose for unknown phase", () => {
    expect(getPhaseHitlProse(defaultConfig, "nonexistent")).toBe("always defer to human");
  });

  test("returns prose for design phase", () => {
    expect(getPhaseHitlProse(defaultConfig, "design")).toBe("always defer to human");
  });
});
```

In `cli/src/__tests__/hitl-settings.test.ts`, update the mock PreToolUse hook to use command type:

Replace the `mockPreToolUseHook` variable:

```typescript
const mockPreToolUseHook = {
  matcher: "AskUserQuestion",
  hooks: [
    {
      type: "command" as const,
      command: 'bun run "$(git rev-parse --show-toplevel)/cli/src/hooks/hitl-auto.ts" design',
    },
  ],
};
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun run test -- --run src/__tests__/hitl-prompt.test.ts 2>&1 | tail -20`
Expected: FAIL — buildPreToolUseHook still returns prompt-type

- [ ] **Step 3: Modify hitl-settings.ts**

In `cli/src/hooks/hitl-settings.ts`:

1. Update `PromptHookEntry` type to reflect command type:

```typescript
/** Shape of a single PreToolUse command hook entry in settings.local.json */
export interface PromptHookEntry {
  matcher: string;
  hooks: Array<{
    type: "command";
    command: string;
  }>;
}
```

2. Replace `buildPreToolUseHook` to return command-type:

```typescript
/**
 * Build the PreToolUse command hook entry for AskUserQuestion.
 *
 * @param phase — The current pipeline phase name
 * @returns A single hook entry targeting AskUserQuestion with a command hook
 */
export function buildPreToolUseHook(phase: string): PromptHookEntry {
  return {
    matcher: "AskUserQuestion",
    hooks: [
      {
        type: "command",
        command: `bun run "$(git rev-parse --show-toplevel)/cli/src/hooks/hitl-auto.ts" ${phase}`,
      },
    ],
  };
}
```

3. Delete the `buildPrompt` function entirely (lines 219-262).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun run test -- --run src/__tests__/hitl-prompt.test.ts src/__tests__/hitl-settings.test.ts 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add cli/src/hooks/hitl-settings.ts cli/src/__tests__/hitl-prompt.test.ts cli/src/__tests__/hitl-settings.test.ts
git commit -m "feat(static-hitl-hooks): change hook builder to command-type, delete buildPrompt"
```

---

### Task 3: Update Call Sites

**Wave:** 3
**Depends on:** Task 2

**Files:**
- Modify: `cli/src/pipeline/runner.ts:158`
- Modify: `cli/src/commands/phase.ts:91-93`
- Modify: `cli/src/__tests__/reconciling-factory-cleanup.test.ts:98`

- [ ] **Step 1: Update pipeline runner.ts**

In `cli/src/pipeline/runner.ts`, change the `buildPreToolUseHook` call from:

```typescript
const hitlProse = getPhaseHitlProse(config.config.hitl, config.phase);
const preToolUseHook = buildPreToolUseHook(hitlProse, config.config.hitl.timeout);
```

to:

```typescript
const preToolUseHook = buildPreToolUseHook(config.phase);
```

The `hitlProse` variable is no longer needed at the call site (the script reads it at runtime). Remove the `getPhaseHitlProse` call from runner.ts if it's only used for this purpose. Check if `getPhaseHitlProse` is still imported — it may be removable from the import statement.

- [ ] **Step 2: Update commands/phase.ts**

In `cli/src/commands/phase.ts`, change:

```typescript
const hitlProse = getPhaseHitlProse(_config.hitl, phase);
const preToolUseHook = buildPreToolUseHook(hitlProse, _config.hitl.timeout);
```

to:

```typescript
const preToolUseHook = buildPreToolUseHook(phase);
```

Remove `getPhaseHitlProse` from the import if no longer used in this file.

- [ ] **Step 3: Update mock in reconciling-factory-cleanup.test.ts**

In `cli/src/__tests__/reconciling-factory-cleanup.test.ts`, the mock at line 98:

```typescript
buildPreToolUseHook: vi.fn(() => ({})),
```

This is fine as-is — the mock returns an empty object regardless of arguments. But verify the mock's `getPhaseHitlProse` is still exported (if the runner still imports it, the mock must keep it). If runner no longer imports it, remove from mock too.

- [ ] **Step 4: Run the full test suite**

Run: `cd cli && bun run test -- --run 2>&1 | tail -30`
Expected: PASS — all unit tests green

- [ ] **Step 5: Commit**

```bash
git add cli/src/pipeline/runner.ts cli/src/commands/phase.ts cli/src/__tests__/reconciling-factory-cleanup.test.ts
git commit -m "refactor(static-hitl-hooks): update call sites to new buildPreToolUseHook(phase) signature"
```

---

### Task 4: Update BDD Feature Files and Step Definitions

**Wave:** 4
**Depends on:** Task 3

**Files:**
- Modify: `cli/features/hitl-hook-lifecycle.feature`
- Modify: `cli/features/file-permissions-hooks.feature`
- Modify: `cli/features/file-permissions-lifecycle.feature`
- Modify: `cli/features/step_definitions/hitl.steps.ts`

- [ ] **Step 1: Add command-type assertion step to hitl.steps.ts**

Add a new step definition for the command-type assertion. The existing step `the worktree settings should contain a PreToolUse hook for {string}` asserts prompt-type. Add a parallel step for command-type:

```typescript
Then("the worktree settings should contain a command-type PreToolUse hook for {string}", function (
  this: PipelineWorld,
  phase: string,
) {
  const settingsPath = getWorktreeSettingsPath(this);
  assert.ok(existsSync(settingsPath), `Settings file does not exist at ${settingsPath}`);

  const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  assert.ok(settings.hooks, "No hooks in settings");
  assert.ok(settings.hooks.PreToolUse, "No PreToolUse in settings.hooks");
  assert.ok(Array.isArray(settings.hooks.PreToolUse), "PreToolUse is not an array");

  const hitlEntry = settings.hooks.PreToolUse.find(
    (entry: any) => entry.matcher === "AskUserQuestion",
  );
  assert.ok(hitlEntry, "No PreToolUse hook found for AskUserQuestion in settings");
  assert.ok(hitlEntry.hooks, "Hook entry has no hooks array");

  const commandHook = hitlEntry.hooks.find((h: any) => h.type === "command");
  assert.ok(commandHook, "No command-type hook found in AskUserQuestion PreToolUse entry");
  assert.ok(
    commandHook.command.includes("hitl-auto.ts"),
    `Command should reference hitl-auto.ts, got: ${commandHook.command}`,
  );
  assert.ok(
    commandHook.command.includes(phase),
    `Command should include phase "${phase}", got: ${commandHook.command}`,
  );

  (this as any)._lastCapturedSettings = settings;
});
```

Also update the existing prompt-type step `the worktree settings should contain a PreToolUse hook for {string}` to use the command-type assertion instead, since ALL HITL hooks are now command-type. Alternatively, rename the old step and keep both if other tests still reference it.

Since the integration artifact specifies exact new Gherkin step text, update the old step to be the command-type version:

Replace the body of `Then("the worktree settings should contain a PreToolUse hook for {string}"` to assert command-type instead of prompt-type.

- [ ] **Step 2: Update hitl-hook-lifecycle.feature**

Replace the three scenarios per the integration artifact:

**Scenario 1: Plan phase**
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

**Scenario 2: Phase-specific**
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

**Scenario 3: Custom settings**
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

- [ ] **Step 3: Update file-permissions-hooks.feature**

Replace the coexistence scenario assertion from:
```
And the worktree settings should contain a PreToolUse hook for "design"
```
to:
```
And the worktree settings should contain a command-type PreToolUse hook for "design"
```

- [ ] **Step 4: Update file-permissions-lifecycle.feature**

Replace both HITL hook assertions from:
```
And the worktree settings should contain a PreToolUse hook for "design"
And the worktree settings should contain a PreToolUse hook for "plan"
```
to:
```
And the worktree settings should contain a command-type PreToolUse hook for "design"
And the worktree settings should contain a command-type PreToolUse hook for "plan"
```

- [ ] **Step 5: Run BDD tests to verify**

Run: `cd cli && bun run cucumber 2>&1 | tail -30`
Expected: PASS — all scenarios green (except possibly the new @static-hitl-hooks ones that test hook script execution)

- [ ] **Step 6: Commit**

```bash
git add cli/features/hitl-hook-lifecycle.feature cli/features/file-permissions-hooks.feature cli/features/file-permissions-lifecycle.feature cli/features/step_definitions/hitl.steps.ts
git commit -m "test(static-hitl-hooks): update BDD scenarios and steps for command-type hooks"
```

---

### Task 5: Final Integration Verification

**Wave:** 5
**Depends on:** Task 4

**Files:**
- (No new files — verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `cd cli && bun run test -- --run 2>&1 | tail -30`
Expected: PASS

- [ ] **Step 2: Run the full BDD test suite**

Run: `cd cli && bun run cucumber 2>&1 | tail -40`
Expected: PASS

- [ ] **Step 3: Run the new integration tests**

Run: `cd cli && bun run cucumber --tags @static-hitl-hooks 2>&1 | tail -40`
Expected: PASS — all static HITL hook scenarios green

- [ ] **Step 4: Verify no prompt references remain**

Run: `cd cli && grep -r "buildPrompt" src/ --include="*.ts" | grep -v node_modules`
Expected: No matches (buildPrompt is fully deleted)

Run: `cd cli && grep -r 'type: "prompt"' src/hooks/hitl-settings.ts`
Expected: No matches (PromptHookEntry uses "command" now)
