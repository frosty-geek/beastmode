# Session Stop Rename — Tasks

## Goal

Rename `generate-output.ts` to `session-stop.ts`, rename `generateAll` to `runSessionStop`, update all imports/references, change the hook dispatcher and command string, replace `isWorktree`/`basename(repoRoot)` slug inference with `BEASTMODE_EPIC_SLUG` env var, and update the BDD feature file.

## Architecture

- Module at `cli/src/hooks/generate-output.ts` becomes `cli/src/hooks/session-stop.ts`
- Public export `generateAll` becomes `runSessionStop`
- Internal functions (`parseFrontmatter`, `buildOutput`, `scanPlanFeatures`, `processArtifact`, `generateChanged`) keep their names
- Hook dispatcher `hooks.ts` replaces `case "generate-output"` with `case "session-stop"`
- `VALID_HOOKS` replaces `"generate-output"` with `"session-stop"`
- `buildStopHook()` in `hitl-settings.ts` emits `bunx beastmode hooks session-stop`
- `cleanHitlSettings()` matches on `"session-stop"` instead of `"generate-output"`
- `runSessionStopHandler()` in `hooks.ts` reads `BEASTMODE_EPIC_SLUG` from env, exits non-zero if missing, removes `isWorktree` detection + `basename(repoRoot)` inference

## Tech Stack

- TypeScript, Bun runtime, vitest for unit tests, Cucumber for BDD

## File Structure

- **Rename**: `cli/src/hooks/generate-output.ts` → `cli/src/hooks/session-stop.ts`
- **Modify**: `cli/src/commands/hooks.ts` — dispatcher, VALID_HOOKS, import, handler
- **Modify**: `cli/src/hooks/hitl-settings.ts` — buildStopHook, cleanHitlSettings
- **Modify**: `cli/src/hooks/session-start.ts` — import path
- **Rename**: `cli/src/__tests__/generate-output.test.ts` → `cli/src/__tests__/session-stop.test.ts`
- **Modify**: `cli/src/__tests__/hooks-command.test.ts` — mock path, test name, assertions
- **Modify**: `cli/features/portable-settings.feature` — expected command string
- **Modify**: `cli/features/support/world.ts` — import path, function name
- **Modify**: `cli/features/step_definitions/output-path-sanitization.steps.ts` — import path

---

### Task 1: Rename module file and update export name

**Wave:** 1
**Depends on:** -

**Files:**
- Rename: `cli/src/hooks/generate-output.ts` → `cli/src/hooks/session-stop.ts`

**Step 1: Rename the file using git mv**

```bash
cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/unified-hook-context
git mv cli/src/hooks/generate-output.ts cli/src/hooks/session-stop.ts
```

- [ ] **Step 2: Update the module header comment**

In `cli/src/hooks/session-stop.ts`, replace the file header:

Old:
```typescript
/**
 * generate-output.ts — Stop hook that reads artifact frontmatter and
 * generates output.json completion contracts.
 *
 * Replaces generate-output-json.sh with typed, testable TypeScript.
```

New:
```typescript
/**
 * session-stop.ts — Stop hook that reads artifact frontmatter and
 * generates output.json completion contracts.
 *
 * Renamed from generate-output.ts for symmetry with session-start.
```

- [ ] **Step 3: Rename `generateAll` to `runSessionStop`**

In `cli/src/hooks/session-stop.ts`, rename the exported function:

Old:
```typescript
export function generateAll(artifactsDir: string, scope?: "changed" | "all", worktreeSlug?: string): number {
```

New:
```typescript
export function runSessionStop(artifactsDir: string, scope?: "changed" | "all", worktreeSlug?: string): number {
```

Also update the recursive fallback call in `generateChanged`:

Old:
```typescript
    return generateAll(artifactsDir, "all", worktreeSlug);
```

New:
```typescript
    return runSessionStop(artifactsDir, "all", worktreeSlug);
```

- [ ] **Step 4: Verify the file compiles**

Run: `bun --bun vitest run cli/src/__tests__/generate-output.test.ts 2>&1 || true`
Expected: FAIL (import path broken — test file still references old path). This confirms the rename worked.

- [ ] **Step 5: Commit**

```bash
git add cli/src/hooks/session-stop.ts cli/src/hooks/generate-output.ts
git commit -m "refactor(session-stop-rename): rename generate-output.ts to session-stop.ts, generateAll to runSessionStop"
```

---

### Task 2: Update hook dispatcher, VALID_HOOKS, and handler

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/commands/hooks.ts`

- [ ] **Step 1: Update the import**

In `cli/src/commands/hooks.ts`, line 20:

Old:
```typescript
import { generateAll } from "../hooks/generate-output.js";
```

New:
```typescript
import { runSessionStop } from "../hooks/session-stop.js";
```

- [ ] **Step 2: Update VALID_HOOKS**

Line 23:

Old:
```typescript
const VALID_HOOKS = ["hitl-auto", "hitl-log", "generate-output", "session-start"];
```

New:
```typescript
const VALID_HOOKS = ["hitl-auto", "hitl-log", "session-stop", "session-start"];
```

- [ ] **Step 3: Update the usage message**

Line 29:

Old:
```typescript
    process.stderr.write("Usage: beastmode hooks <hitl-auto|hitl-log|generate-output|session-start> [phase]\n");
```

New:
```typescript
    process.stderr.write("Usage: beastmode hooks <hitl-auto|hitl-log|session-stop|session-start> [phase]\n");
```

- [ ] **Step 4: Update the switch case and handler**

Replace lines 61-63 (case "generate-output") and lines 120-133 (runGenerateOutput function):

Old case:
```typescript
      case "generate-output":
        runGenerateOutput();
        break;
```

New case:
```typescript
      case "session-stop":
        runSessionStopHandler();
        break;
```

Replace the old `runGenerateOutput` function (lines 120-133) with:

```typescript
function runSessionStopHandler(): void {
  const epicSlug = process.env.BEASTMODE_EPIC_SLUG;
  if (!epicSlug) {
    process.stderr.write("session-stop hook failed: Missing environment variable: BEASTMODE_EPIC_SLUG\n");
    process.exit(1);
  }

  const repoRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
  const artifactsDir = resolve(repoRoot, ".beastmode", "artifacts");
  runSessionStop(artifactsDir, "changed", epicSlug);
}
```

- [ ] **Step 5: Remove unused imports**

Remove `basename` and `statSync` from the import lines since `isWorktree` detection and `basename(repoRoot)` are gone:

Old:
```typescript
import { resolve, basename, dirname } from "node:path";
import { mkdirSync, appendFileSync, existsSync, statSync } from "node:fs";
```

New:
```typescript
import { resolve, dirname } from "node:path";
import { mkdirSync, appendFileSync, existsSync } from "node:fs";
```

- [ ] **Step 6: Commit**

```bash
git add cli/src/commands/hooks.ts
git commit -m "refactor(session-stop-rename): update hook dispatcher, VALID_HOOKS, and command handler"
```

---

### Task 3: Update hitl-settings, tests, and BDD files

**Wave:** 2
**Depends on:** Task 1, Task 2

**Files:**
- Modify: `cli/src/hooks/hitl-settings.ts`
- Modify: `cli/src/hooks/session-start.ts` (line 13 import)
- Rename: `cli/src/__tests__/generate-output.test.ts` → `cli/src/__tests__/session-stop.test.ts`
- Modify: `cli/src/__tests__/hooks-command.test.ts`
- Modify: `cli/features/portable-settings.feature`
- Modify: `cli/features/support/world.ts`
- Modify: `cli/features/step_definitions/output-path-sanitization.steps.ts`

- [ ] **Step 1: Update `buildStopHook` in hitl-settings.ts**

Lines 200-214:

Old:
```typescript
/**
 * Build the Stop hook for output.json generation.
 * Calls generate-output via portable CLI after Claude finishes responding.
 */
function buildStopHook(): HookEntry {
  return {
    matcher: "",
    hooks: [
      {
        type: "command",
        command: `bunx beastmode hooks generate-output`,
      },
    ],
  };
}
```

New:
```typescript
/**
 * Build the Stop hook for output.json generation.
 * Calls session-stop via portable CLI after Claude finishes responding.
 */
function buildStopHook(): HookEntry {
  return {
    matcher: "",
    hooks: [
      {
        type: "command",
        command: `bunx beastmode hooks session-stop`,
      },
    ],
  };
}
```

- [ ] **Step 2: Update `cleanHitlSettings` filter in hitl-settings.ts**

Line 155:

Old:
```typescript
      (h) => !h.hooks?.some((hk) => hk.command?.includes("generate-output")),
```

New:
```typescript
      (h) => !h.hooks?.some((hk) => hk.command?.includes("session-stop")),
```

- [ ] **Step 3: Update session-start.ts import**

Line 13:

Old:
```typescript
import { parseFrontmatter } from "./generate-output.js";
```

New:
```typescript
import { parseFrontmatter } from "./session-stop.js";
```

- [ ] **Step 4: Rename and update the unit test file**

```bash
cd /Users/D038720/Code/github.com/bugroger/beastmode/.claude/worktrees/unified-hook-context
git mv cli/src/__tests__/generate-output.test.ts cli/src/__tests__/session-stop.test.ts
```

In `cli/src/__tests__/session-stop.test.ts`, update the import (line 10):

Old:
```typescript
} from "../hooks/generate-output";
```

New:
```typescript
} from "../hooks/session-stop";
```

Also update the test root variable (line 12):

Old:
```typescript
const TEST_ROOT = resolve(import.meta.dirname, "../../.test-generate-output");
```

New:
```typescript
const TEST_ROOT = resolve(import.meta.dirname, "../../.test-session-stop");
```

- [ ] **Step 5: Update hooks-command.test.ts**

Update the mock (line 12-14):

Old:
```typescript
vi.mock("../hooks/generate-output.js", () => ({
  generateAll: vi.fn(() => 0),
}));
```

New:
```typescript
vi.mock("../hooks/session-stop.js", () => ({
  runSessionStop: vi.fn(() => 0),
}));
```

Update the import (line 62):

Old:
```typescript
import { generateAll } from "../hooks/generate-output.js";
```

New:
```typescript
import { runSessionStop } from "../hooks/session-stop.js";
```

Update the test (lines 105-111):

Old:
```typescript
  test("generate-output dispatches to generateAll", async () => {
    try {
      await hooksCommand(["generate-output"]);
    } catch { /* exit mock */ }

    expect(generateAll).toHaveBeenCalled();
  });
```

New:
```typescript
  test("session-stop dispatches to runSessionStop", async () => {
    process.env.BEASTMODE_EPIC_SLUG = "test-epic";
    try {
      await hooksCommand(["session-stop"]);
    } catch { /* exit mock */ }

    expect(runSessionStop).toHaveBeenCalled();
    delete process.env.BEASTMODE_EPIC_SLUG;
  });
```

- [ ] **Step 6: Update portable-settings.feature**

Line 19:

Old:
```gherkin
    Then the Stop hook command should be "bunx beastmode hooks generate-output"
```

New:
```gherkin
    Then the Stop hook command should be "bunx beastmode hooks session-stop"
```

- [ ] **Step 7: Update world.ts import and function call**

Line 16:

Old:
```typescript
import { generateAll } from "../../src/hooks/generate-output.js";
```

New:
```typescript
import { runSessionStop } from "../../src/hooks/session-stop.js";
```

Line 248:

Old:
```typescript
    generateAll(artifactsDir, "all", worktreeSlug);
```

New:
```typescript
    runSessionStop(artifactsDir, "all", worktreeSlug);
```

- [ ] **Step 8: Update output-path-sanitization.steps.ts import**

Line 12:

Old:
```typescript
import { buildOutput, scanPlanFeatures } from "../../src/hooks/generate-output.js";
```

New:
```typescript
import { buildOutput, scanPlanFeatures } from "../../src/hooks/session-stop.js";
```

- [ ] **Step 9: Run tests**

Run: `bun --bun vitest run cli/src/__tests__/session-stop.test.ts cli/src/__tests__/hooks-command.test.ts cli/src/__tests__/hitl-settings.test.ts`
Expected: ALL PASS

- [ ] **Step 10: Commit**

```bash
git add cli/src/hooks/hitl-settings.ts cli/src/hooks/session-start.ts \
  cli/src/__tests__/session-stop.test.ts cli/src/__tests__/generate-output.test.ts \
  cli/src/__tests__/hooks-command.test.ts \
  cli/features/portable-settings.feature \
  cli/features/support/world.ts \
  cli/features/step_definitions/output-path-sanitization.steps.ts
git commit -m "refactor(session-stop-rename): update all imports, tests, and BDD files"
```

---

### Task 4: Verify full test suite

**Wave:** 3
**Depends on:** Task 3

**Files:**
- None (verification only)

- [ ] **Step 1: Run full unit test suite**

Run: `bun --bun vitest run`
Expected: ALL PASS

- [ ] **Step 2: Grep for stale references**

Run: `grep -r "generate-output" cli/src/ cli/features/ --include="*.ts" --include="*.feature" | grep -v node_modules | grep -v ".output.json"`
Expected: No matches (all references updated)

- [ ] **Step 3: Grep for old function name**

Run: `grep -r "generateAll" cli/src/ cli/features/ --include="*.ts" --include="*.feature" | grep -v node_modules`
Expected: No matches
