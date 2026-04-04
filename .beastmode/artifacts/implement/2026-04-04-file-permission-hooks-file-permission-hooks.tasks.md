# File Permission Hooks — Implementation Tasks

## Goal

Add PreToolUse prompt hooks for Write and Edit tools with `if`-field path filtering, written to `settings.local.json` at dispatch time. This enables the pipeline to auto-allow, auto-deny, or defer file permission dialogs for `.claude/**` paths based on user prose in `config.yaml`.

## Architecture

- **Hook type:** PreToolUse prompt hooks on Write and Edit tools (analogous to HITL AskUserQuestion hooks)
- **Path filtering:** `if` field with permission-rule syntax: `Write(.claude/**)`, `Edit(.claude/**)`
- **Decision model:** Three outcomes — auto-allow (`permissionDecision: "allow"`), hard deny (`permissionDecision: "deny"`), defer to human (`permissionDecision: "allow"` with no `updatedInput`)
- **Lifecycle:** Dispatch-scoped — written alongside HITL hooks, cleaned between dispatches
- **Logging:** PostToolUse command hooks for Write and Edit appending to same HITL log
- **Config:** `file-permissions.claude-settings` prose from `config.yaml`, already parsed by `config.ts`
- **Error handling:** Fail-open — hook failure passes through to native dialog

## Tech Stack

- TypeScript, Bun runtime, bun:test
- Existing modules: `cli/src/hooks/hitl-settings.ts`, `cli/src/config.ts`
- Test file: `cli/src/__tests__/hitl-settings.test.ts` (extend), new `cli/src/__tests__/file-permission-settings.test.ts`

## File Structure

| File | Responsibility |
|---|---|
| `cli/src/hooks/file-permission-settings.ts` | **Create.** Hook builders (`buildFilePermissionPreToolUseHook`, `buildFilePermissionPrompt`, `buildFilePermissionPostToolUseHook`), settings lifecycle (`writeFilePermissionSettings`, `cleanFilePermissionSettings`), category-to-path mapping. |
| `cli/src/__tests__/file-permission-settings.test.ts` | **Create.** Unit tests for hook generation, prompt construction, write/clean lifecycle, coexistence with HITL hooks. |
| `cli/src/pipeline/runner.ts` | **Modify:135-141.** Add file-permission hook write alongside HITL hooks in Step 3. |
| `cli/src/commands/watch.ts` | **Modify:143-149.** Add file-permission hook write alongside HITL hooks in dispatchPhase. |
| `cli/src/commands/phase.ts` | **Modify:66-71.** Add file-permission hook write alongside HITL hooks in cmux path. |

---

### Task 0: File Permission Hook Builders

**Wave:** 1
**Depends on:** -

**Files:**
- Create: `cli/src/hooks/file-permission-settings.ts`
- Create: `cli/src/__tests__/file-permission-settings.test.ts`

- [ ] **Step 1: Write the failing tests for hook builders**

Create `cli/src/__tests__/file-permission-settings.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import {
  buildFilePermissionPreToolUseHooks,
  buildFilePermissionPrompt,
  CATEGORY_PATH_MAP,
} from "../hooks/file-permission-settings";

describe("CATEGORY_PATH_MAP", () => {
  test("claude-settings maps to .claude/**", () => {
    expect(CATEGORY_PATH_MAP["claude-settings"]).toBe(".claude/**");
  });
});

describe("buildFilePermissionPrompt", () => {
  test("includes user prose in prompt", () => {
    const prompt = buildFilePermissionPrompt("auto-allow all .claude writes");
    expect(prompt).toContain("auto-allow all .claude writes");
  });

  test("includes three-outcome decision model", () => {
    const prompt = buildFilePermissionPrompt("some prose");
    expect(prompt).toContain("permissionDecision");
    expect(prompt).toContain('"allow"');
    expect(prompt).toContain('"deny"');
  });

  test("mentions $ARGUMENTS for tool input", () => {
    const prompt = buildFilePermissionPrompt("some prose");
    expect(prompt).toContain("$ARGUMENTS");
  });
});

describe("buildFilePermissionPreToolUseHooks", () => {
  test("returns two hook entries for Write and Edit", () => {
    const hooks = buildFilePermissionPreToolUseHooks("auto-allow all", 30);
    expect(hooks).toHaveLength(2);

    const matchers = hooks.map((h) => h.matcher);
    expect(matchers).toContain("Write");
    expect(matchers).toContain("Edit");
  });

  test("each hook has if condition with correct path pattern", () => {
    const hooks = buildFilePermissionPreToolUseHooks("auto-allow all", 30);
    const writeHook = hooks.find((h) => h.matcher === "Write")!;
    const editHook = hooks.find((h) => h.matcher === "Edit")!;

    expect(writeHook.hooks[0]).toHaveProperty("if");
    expect((writeHook.hooks[0] as any).if).toBe("Write(.claude/**)");
    expect(editHook.hooks[0]).toHaveProperty("if");
    expect((editHook.hooks[0] as any).if).toBe("Edit(.claude/**)");
  });

  test("each hook is a prompt type with timeout", () => {
    const hooks = buildFilePermissionPreToolUseHooks("test prose", 45);
    for (const hook of hooks) {
      expect(hook.hooks[0].type).toBe("prompt");
      expect(hook.hooks[0].timeout).toBe(45);
      expect(hook.hooks[0].prompt).toBeDefined();
    }
  });

  test("uses default timeout of 30 when not specified", () => {
    const hooks = buildFilePermissionPreToolUseHooks("test prose");
    for (const hook of hooks) {
      expect(hook.hooks[0].timeout).toBe(30);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun test --filter "file-permission-settings" 2>&1`
Expected: FAIL — module not found

- [ ] **Step 3: Write the hook builder implementation**

Create `cli/src/hooks/file-permission-settings.ts`:

```typescript
/**
 * file-permission-settings.ts — File permission hook composition for Write/Edit tools.
 *
 * Builds PreToolUse prompt hooks with `if`-field path filtering so that
 * only file operations targeting specific paths (e.g., .claude/**) trigger
 * the LLM-based permission decision. Analogous to hitl-settings.ts but for
 * file permission dialogs instead of AskUserQuestion auto-answering.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { resolve } from "node:path";

// --- Types ---

interface FilePermissionHookHandler {
  type: "prompt";
  prompt: string;
  if: string;
  timeout?: number;
}

interface FilePermissionHookEntry {
  matcher: string;
  hooks: FilePermissionHookHandler[];
}

interface SettingsLocal {
  enabledPlugins?: Record<string, boolean>;
  hooks?: {
    PreToolUse?: Array<{ matcher: string; hooks: Array<Record<string, unknown>> }>;
    PostToolUse?: Array<{ matcher: string; hooks: Array<Record<string, unknown>> }>;
    [key: string]: Array<{ matcher: string; hooks: Array<Record<string, unknown>> }> | undefined;
  };
  [key: string]: unknown;
}

export interface WriteFilePermissionSettingsOptions {
  claudeDir: string;
  preToolUseHooks: FilePermissionHookEntry[];
  postToolUseHooks: Array<{ matcher: string; hooks: Array<Record<string, unknown>> }>;
}

// --- Constants ---

/** Hardcoded category-to-path mapping. Users configure prose per category, not path globs. */
export const CATEGORY_PATH_MAP: Record<string, string> = {
  "claude-settings": ".claude/**",
};

/** Matchers used by file-permission hooks — used for identification during clean. */
const FILE_PERMISSION_MATCHERS = ["Write", "Edit"];

// --- Hook Builders ---

/**
 * Build the prompt for file permission decisions.
 *
 * Three possible outcomes:
 * 1. Auto-allow: { permissionDecision: "allow" }
 * 2. Hard deny: { permissionDecision: "deny" }
 * 3. Defer to human: { permissionDecision: "allow" } with no updatedInput
 */
export function buildFilePermissionPrompt(prose: string): string {
  return `You are a file permission hook. Your job is to decide whether to allow, deny, or defer a file write/edit operation.

## User's File Permission Instructions

${prose}

## Input

The tool input is provided in $ARGUMENTS as JSON. For Write tools, it contains "file_path" and "content". For Edit tools, it contains "file_path", "old_string", and "new_string".

## Decision Rules

1. Read the file path and content/diff from $ARGUMENTS
2. Apply the user's instructions above to decide:
   - **Allow**: The operation is safe and matches the user's intent
   - **Deny**: The operation violates the user's intent or is unsafe
   - **Defer**: The operation is ambiguous or not covered by instructions
3. If instructions say "always defer to human", ALWAYS return the defer response
4. On ANY error, uncertainty, or edge case: DEFER (fail-open)

## Response Format

To ALLOW (auto-approve the file operation):
\`\`\`json
{"permissionDecision": "allow"}
\`\`\`

To DENY (block the file operation):
\`\`\`json
{"permissionDecision": "deny"}
\`\`\`

To DEFER to human (pass through to native permission dialog):
Return empty — no JSON block, no output. Silent pass-through.

IMPORTANT:
- Never add explanations outside the JSON block
- If unsure, produce no output (defer)
- The "allow" response has NO updatedInput — it just approves the operation as-is`;
}

/**
 * Build PreToolUse prompt hook entries for Write and Edit tools.
 *
 * Each hook uses the `if` field to filter by path pattern, ensuring
 * zero LLM overhead for non-matching file paths.
 */
export function buildFilePermissionPreToolUseHooks(
  prose: string,
  timeout: number = 30,
): FilePermissionHookEntry[] {
  const prompt = buildFilePermissionPrompt(prose);
  const pathPattern = CATEGORY_PATH_MAP["claude-settings"];

  return FILE_PERMISSION_MATCHERS.map((tool) => ({
    matcher: tool,
    hooks: [
      {
        type: "prompt" as const,
        prompt,
        if: `${tool}(${pathPattern})`,
        timeout,
      },
    ],
  }));
}

/**
 * Build PostToolUse command hooks for Write and Edit decision logging.
 * Calls hitl-log.ts with the phase argument — reuses same log infrastructure.
 */
export function buildFilePermissionPostToolUseHooks(phase: string): Array<{ matcher: string; hooks: Array<Record<string, unknown>> }> {
  return FILE_PERMISSION_MATCHERS.map((tool) => ({
    matcher: tool,
    hooks: [
      {
        type: "command",
        command: `bun run "$(git rev-parse --show-toplevel)/cli/src/hooks/hitl-log.ts" ${phase}`,
      },
    ],
  }));
}

// --- Settings Lifecycle ---

/**
 * Write file-permission hooks to settings.local.json alongside existing hooks.
 *
 * Preserves all existing keys (enabledPlugins, HITL hooks, etc.) and replaces
 * only the Write/Edit hook entries.
 */
export function writeFilePermissionSettings(options: WriteFilePermissionSettingsOptions): void {
  const { claudeDir, preToolUseHooks, postToolUseHooks } = options;
  const settingsPath = resolve(claudeDir, "settings.local.json");

  let settings: SettingsLocal = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {
      settings = {};
    }
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }

  // Replace Write/Edit PreToolUse hooks
  let preToolUse = (settings.hooks.PreToolUse ?? []).filter(
    (h) => !FILE_PERMISSION_MATCHERS.includes(h.matcher),
  );
  preToolUse.push(...(preToolUseHooks as any[]));
  settings.hooks.PreToolUse = preToolUse;

  // Replace Write/Edit PostToolUse hooks
  let postToolUse = (settings.hooks.PostToolUse ?? []).filter(
    (h) => !FILE_PERMISSION_MATCHERS.includes(h.matcher),
  );
  postToolUse.push(...postToolUseHooks);
  settings.hooks.PostToolUse = postToolUse;

  // Atomic write
  mkdirSync(claudeDir, { recursive: true });
  const tmpPath = settingsPath + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n");
  renameSync(tmpPath, settingsPath);
}

/**
 * Remove file-permission hooks from settings.local.json, preserving everything else.
 * Called between dispatches to prevent stale state.
 */
export function cleanFilePermissionSettings(claudeDir: string): void {
  const settingsPath = resolve(claudeDir, "settings.local.json");
  if (!existsSync(settingsPath)) return;

  let settings: SettingsLocal;
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    return;
  }

  if (!settings.hooks) return;

  if (settings.hooks.PreToolUse) {
    settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
      (h) => !FILE_PERMISSION_MATCHERS.includes(h.matcher),
    );
    if (settings.hooks.PreToolUse.length === 0) {
      delete settings.hooks.PreToolUse;
    }
  }
  if (settings.hooks.PostToolUse) {
    settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
      (h) => !FILE_PERMISSION_MATCHERS.includes(h.matcher),
    );
    if (settings.hooks.PostToolUse.length === 0) {
      delete settings.hooks.PostToolUse;
    }
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cli && bun test --filter "file-permission-settings" 2>&1`
Expected: PASS — all 10 tests

- [ ] **Step 5: Commit**

```bash
git add cli/src/hooks/file-permission-settings.ts cli/src/__tests__/file-permission-settings.test.ts
git commit -m "feat(file-permission-hooks): add hook builders and prompt constructor"
```

---

### Task 1: Settings Lifecycle Tests (Write and Clean)

**Wave:** 1
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/__tests__/file-permission-settings.test.ts`

- [ ] **Step 1: Write failing tests for writeFilePermissionSettings and cleanFilePermissionSettings**

Append to `cli/src/__tests__/file-permission-settings.test.ts`:

```typescript
import {
  writeFilePermissionSettings,
  cleanFilePermissionSettings,
  buildFilePermissionPostToolUseHooks,
} from "../hooks/file-permission-settings";
import { writeHitlSettings, cleanHitlSettings } from "../hooks/hitl-settings";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

function makeTempClaudeDir(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "fp-settings-test-"));
  const claudeDir = join(tempDir, ".claude");
  mkdirSync(claudeDir, { recursive: true });
  return claudeDir;
}

function readSettings(claudeDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(claudeDir, "settings.local.json"), "utf-8"));
}

describe("writeFilePermissionSettings", () => {
  test("creates settings.local.json when none exists", () => {
    const claudeDir = makeTempClaudeDir();
    const preToolUseHooks = buildFilePermissionPreToolUseHooks("test prose", 30);
    const postToolUseHooks = buildFilePermissionPostToolUseHooks("implement");

    writeFilePermissionSettings({ claudeDir, preToolUseHooks, postToolUseHooks });

    const settings = readSettings(claudeDir);
    expect(settings.hooks).toBeDefined();
    const hooks = settings.hooks as Record<string, unknown[]>;
    expect(hooks.PreToolUse).toHaveLength(2); // Write + Edit
    expect(hooks.PostToolUse).toHaveLength(2);
  });

  test("PreToolUse hooks target Write and Edit with if conditions", () => {
    const claudeDir = makeTempClaudeDir();
    const preToolUseHooks = buildFilePermissionPreToolUseHooks("test", 30);
    const postToolUseHooks = buildFilePermissionPostToolUseHooks("implement");

    writeFilePermissionSettings({ claudeDir, preToolUseHooks, postToolUseHooks });

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;
    const matchers = hooks.PreToolUse.map((h: any) => h.matcher);
    expect(matchers).toContain("Write");
    expect(matchers).toContain("Edit");

    const writeHook = hooks.PreToolUse.find((h: any) => h.matcher === "Write");
    expect(writeHook.hooks[0].if).toBe("Write(.claude/**)");
  });

  test("preserves existing enabledPlugins", () => {
    const claudeDir = makeTempClaudeDir();
    writeFileSync(
      join(claudeDir, "settings.local.json"),
      JSON.stringify({ enabledPlugins: { "beastmode@beastmode-marketplace": true } }),
    );

    const preToolUseHooks = buildFilePermissionPreToolUseHooks("test", 30);
    const postToolUseHooks = buildFilePermissionPostToolUseHooks("implement");
    writeFilePermissionSettings({ claudeDir, preToolUseHooks, postToolUseHooks });

    const settings = readSettings(claudeDir);
    expect(settings.enabledPlugins).toEqual({ "beastmode@beastmode-marketplace": true });
  });

  test("replaces existing file-permission hooks on re-write", () => {
    const claudeDir = makeTempClaudeDir();

    // First write
    writeFilePermissionSettings({
      claudeDir,
      preToolUseHooks: buildFilePermissionPreToolUseHooks("first", 30),
      postToolUseHooks: buildFilePermissionPostToolUseHooks("design"),
    });

    // Second write
    writeFilePermissionSettings({
      claudeDir,
      preToolUseHooks: buildFilePermissionPreToolUseHooks("second", 45),
      postToolUseHooks: buildFilePermissionPostToolUseHooks("implement"),
    });

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;
    expect(hooks.PreToolUse).toHaveLength(2); // Still just Write + Edit
    expect(hooks.PostToolUse).toHaveLength(2);
    // Verify updated timeout
    expect(hooks.PreToolUse[0].hooks[0].timeout).toBe(45);
  });

  test("preserves non-file-permission hooks (e.g. AskUserQuestion)", () => {
    const claudeDir = makeTempClaudeDir();
    writeFileSync(
      join(claudeDir, "settings.local.json"),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            { matcher: "AskUserQuestion", hooks: [{ type: "prompt", prompt: "hitl prompt" }] },
          ],
          PostToolUse: [
            { matcher: "AskUserQuestion", hooks: [{ type: "command", command: "hitl-log.ts" }] },
          ],
        },
      }),
    );

    const preToolUseHooks = buildFilePermissionPreToolUseHooks("test", 30);
    const postToolUseHooks = buildFilePermissionPostToolUseHooks("implement");
    writeFilePermissionSettings({ claudeDir, preToolUseHooks, postToolUseHooks });

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;
    expect(hooks.PreToolUse).toHaveLength(3); // AskUserQuestion + Write + Edit
    expect(hooks.PostToolUse).toHaveLength(3);
    const preMatchers = hooks.PreToolUse.map((h: any) => h.matcher);
    expect(preMatchers).toContain("AskUserQuestion");
    expect(preMatchers).toContain("Write");
    expect(preMatchers).toContain("Edit");
  });

  test("handles malformed existing JSON gracefully", () => {
    const claudeDir = makeTempClaudeDir();
    writeFileSync(join(claudeDir, "settings.local.json"), "not json{{{");

    const preToolUseHooks = buildFilePermissionPreToolUseHooks("test", 30);
    const postToolUseHooks = buildFilePermissionPostToolUseHooks("implement");
    writeFilePermissionSettings({ claudeDir, preToolUseHooks, postToolUseHooks });

    const settings = readSettings(claudeDir);
    expect(settings.hooks).toBeDefined();
  });
});

describe("cleanFilePermissionSettings", () => {
  test("removes Write/Edit hooks, preserves enabledPlugins", () => {
    const claudeDir = makeTempClaudeDir();
    writeFileSync(
      join(claudeDir, "settings.local.json"),
      JSON.stringify({
        enabledPlugins: { "beastmode@beastmode-marketplace": true },
        hooks: {
          PreToolUse: [
            { matcher: "Write", hooks: [{ type: "prompt", prompt: "test" }] },
            { matcher: "Edit", hooks: [{ type: "prompt", prompt: "test" }] },
          ],
          PostToolUse: [
            { matcher: "Write", hooks: [{ type: "command", command: "test" }] },
            { matcher: "Edit", hooks: [{ type: "command", command: "test" }] },
          ],
        },
      }),
    );

    cleanFilePermissionSettings(claudeDir);

    const settings = readSettings(claudeDir);
    expect(settings.enabledPlugins).toEqual({ "beastmode@beastmode-marketplace": true });
    expect(settings.hooks).toBeUndefined();
  });

  test("preserves non-file-permission hooks (AskUserQuestion)", () => {
    const claudeDir = makeTempClaudeDir();
    writeFileSync(
      join(claudeDir, "settings.local.json"),
      JSON.stringify({
        hooks: {
          PreToolUse: [
            { matcher: "AskUserQuestion", hooks: [{ type: "prompt", prompt: "hitl" }] },
            { matcher: "Write", hooks: [{ type: "prompt", prompt: "fp" }] },
            { matcher: "Edit", hooks: [{ type: "prompt", prompt: "fp" }] },
          ],
        },
      }),
    );

    cleanFilePermissionSettings(claudeDir);

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PreToolUse[0].matcher).toBe("AskUserQuestion");
  });

  test("no-op when file does not exist", () => {
    const claudeDir = makeTempClaudeDir();
    cleanFilePermissionSettings(claudeDir);
    // Should not throw
  });

  test("no-op when no hooks section", () => {
    const claudeDir = makeTempClaudeDir();
    writeFileSync(
      join(claudeDir, "settings.local.json"),
      JSON.stringify({ enabledPlugins: {} }),
    );

    cleanFilePermissionSettings(claudeDir);

    const settings = readSettings(claudeDir);
    expect(settings.enabledPlugins).toEqual({});
    expect(settings.hooks).toBeUndefined();
  });
});

describe("HITL + file-permission coexistence", () => {
  test("both hook systems coexist in settings.local.json", () => {
    const claudeDir = makeTempClaudeDir();

    // Write HITL hooks first
    writeHitlSettings({
      claudeDir,
      preToolUseHook: {
        matcher: "AskUserQuestion",
        hooks: [{ type: "prompt", prompt: "hitl prompt", timeout: 30 }],
      },
      phase: "implement",
    });

    // Write file-permission hooks
    const preToolUseHooks = buildFilePermissionPreToolUseHooks("auto-allow all", 30);
    const postToolUseHooks = buildFilePermissionPostToolUseHooks("implement");
    writeFilePermissionSettings({ claudeDir, preToolUseHooks, postToolUseHooks });

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;

    // PreToolUse: AskUserQuestion + Write + Edit = 3
    expect(hooks.PreToolUse).toHaveLength(3);
    const preMatchers = hooks.PreToolUse.map((h: any) => h.matcher).sort();
    expect(preMatchers).toEqual(["AskUserQuestion", "Edit", "Write"]);

    // PostToolUse: AskUserQuestion + Write + Edit = 3
    expect(hooks.PostToolUse).toHaveLength(3);
  });

  test("cleaning file-permission hooks preserves HITL hooks", () => {
    const claudeDir = makeTempClaudeDir();

    // Write both
    writeHitlSettings({
      claudeDir,
      preToolUseHook: {
        matcher: "AskUserQuestion",
        hooks: [{ type: "prompt", prompt: "hitl prompt", timeout: 30 }],
      },
      phase: "implement",
    });
    writeFilePermissionSettings({
      claudeDir,
      preToolUseHooks: buildFilePermissionPreToolUseHooks("test", 30),
      postToolUseHooks: buildFilePermissionPostToolUseHooks("implement"),
    });

    // Clean only file-permission hooks
    cleanFilePermissionSettings(claudeDir);

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;
    expect(hooks.PreToolUse).toHaveLength(1);
    expect(hooks.PreToolUse[0].matcher).toBe("AskUserQuestion");
    expect(hooks.PostToolUse).toHaveLength(1);
    expect(hooks.PostToolUse[0].matcher).toBe("AskUserQuestion");
  });

  test("cleaning HITL hooks preserves file-permission hooks", () => {
    const claudeDir = makeTempClaudeDir();

    // Write both
    writeHitlSettings({
      claudeDir,
      preToolUseHook: {
        matcher: "AskUserQuestion",
        hooks: [{ type: "prompt", prompt: "hitl prompt", timeout: 30 }],
      },
      phase: "implement",
    });
    writeFilePermissionSettings({
      claudeDir,
      preToolUseHooks: buildFilePermissionPreToolUseHooks("test", 30),
      postToolUseHooks: buildFilePermissionPostToolUseHooks("implement"),
    });

    // Clean only HITL hooks
    cleanHitlSettings(claudeDir);

    const settings = readSettings(claudeDir);
    const hooks = settings.hooks as any;
    expect(hooks.PreToolUse).toHaveLength(2);
    const matchers = hooks.PreToolUse.map((h: any) => h.matcher).sort();
    expect(matchers).toEqual(["Edit", "Write"]);
    expect(hooks.PostToolUse).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cli && bun test --filter "file-permission-settings" 2>&1`
Expected: FAIL — imports not matching (tests reference new functions from Task 0)

- [ ] **Step 3: Run all tests to verify they pass**

Run: `cd cli && bun test --filter "file-permission-settings" 2>&1`
Expected: PASS — all tests including lifecycle and coexistence

- [ ] **Step 4: Commit**

```bash
git add cli/src/__tests__/file-permission-settings.test.ts
git commit -m "test(file-permission-hooks): add lifecycle and coexistence tests"
```

---

### Task 2: Dispatch Integration — Pipeline Runner

**Wave:** 2
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/pipeline/runner.ts`

- [ ] **Step 1: Add file-permission imports and hook write to runner.ts**

Add to the import block of `cli/src/pipeline/runner.ts`:

```typescript
import {
  writeFilePermissionSettings,
  cleanFilePermissionSettings,
  buildFilePermissionPreToolUseHooks,
  buildFilePermissionPostToolUseHooks,
} from "../hooks/file-permission-settings.js";
import { getCategoryProse } from "../config.js";
```

In the Step 3 block (lines ~135-141), after `writeHitlSettings(...)`, add:

```typescript
    // File-permission hooks
    cleanFilePermissionSettings(claudeDir);
    const fpProse = getCategoryProse(config.config["file-permissions"], "claude-settings");
    const fpPreToolUseHooks = buildFilePermissionPreToolUseHooks(fpProse, config.config["file-permissions"].timeout);
    const fpPostToolUseHooks = buildFilePermissionPostToolUseHooks(config.phase);
    writeFilePermissionSettings({ claudeDir, preToolUseHooks: fpPreToolUseHooks, postToolUseHooks: fpPostToolUseHooks });
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `cd cli && bun test 2>&1`
Expected: PASS — all existing tests pass

- [ ] **Step 3: Commit**

```bash
git add cli/src/pipeline/runner.ts
git commit -m "feat(file-permission-hooks): integrate with pipeline runner dispatch"
```

---

### Task 3: Dispatch Integration — Watch Command

**Wave:** 2
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/commands/watch.ts`

- [ ] **Step 1: Add file-permission imports and hook write to watch.ts**

Add to the import block of `cli/src/commands/watch.ts`:

```typescript
import {
  writeFilePermissionSettings,
  cleanFilePermissionSettings,
  buildFilePermissionPreToolUseHooks,
  buildFilePermissionPostToolUseHooks,
} from "../hooks/file-permission-settings.js";
import { getCategoryProse } from "../config.js";
```

In the `dispatchPhase()` function, after `writeHitlSettings(...)` (line ~149), add:

```typescript
  // File-permission hooks
  cleanFilePermissionSettings(claudeDir);
  const fpProse = getCategoryProse(config["file-permissions"], "claude-settings");
  const fpPreToolUseHooks = buildFilePermissionPreToolUseHooks(fpProse, config["file-permissions"].timeout);
  const fpPostToolUseHooks = buildFilePermissionPostToolUseHooks(opts.phase);
  writeFilePermissionSettings({ claudeDir, preToolUseHooks: fpPreToolUseHooks, postToolUseHooks: fpPostToolUseHooks });
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `cd cli && bun test 2>&1`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/commands/watch.ts
git commit -m "feat(file-permission-hooks): integrate with watch command dispatch"
```

---

### Task 4: Dispatch Integration — Phase Command

**Wave:** 2
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/commands/phase.ts`

- [ ] **Step 1: Add file-permission imports and hook write to phase.ts**

Add to the import block of `cli/src/commands/phase.ts`:

```typescript
import {
  writeFilePermissionSettings,
  cleanFilePermissionSettings,
  buildFilePermissionPreToolUseHooks,
  buildFilePermissionPostToolUseHooks,
} from "../hooks/file-permission-settings.js";
import { getCategoryProse } from "../config.js";
```

In the cmux path block (after `writeHitlSettings(...)` at line ~71), add:

```typescript
    // File-permission hooks
    cleanFilePermissionSettings(claudeDir);
    const fpProse = getCategoryProse(_config["file-permissions"], "claude-settings");
    const fpPreToolUseHooks = buildFilePermissionPreToolUseHooks(fpProse, _config["file-permissions"].timeout);
    const fpPostToolUseHooks = buildFilePermissionPostToolUseHooks(phase);
    writeFilePermissionSettings({ claudeDir, preToolUseHooks: fpPreToolUseHooks, postToolUseHooks: fpPostToolUseHooks });
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `cd cli && bun test 2>&1`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/commands/phase.ts
git commit -m "feat(file-permission-hooks): integrate with phase command dispatch"
```

---
