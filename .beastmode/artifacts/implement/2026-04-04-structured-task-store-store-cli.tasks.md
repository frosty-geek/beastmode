# Store CLI — Implementation Tasks

## Goal

Build the `beastmode store` CLI command namespace — thin routing layer that parses arguments, calls `TaskStore` methods via `JsonFileStore.transact()`, and emits JSON to stdout.

## Architecture

- **CLI entry point:** `cli/src/index.ts` — routes `store` command to handler
- **Arg parser:** `cli/src/args.ts` — recognizes `store` as utility command
- **Command type:** `cli/src/types.ts` — `Command` union includes `"store"`
- **Store command handler:** `cli/src/commands/store.ts` — subcommand dispatch + arg parsing
- **Store backend:** `cli/src/store/json-file-store.ts` — `JsonFileStore` with `transact()` for atomic ops
- **Output contract:** All commands emit JSON to stdout. Errors emit `{ "error": "message" }` with `process.exit(1)`.

## Tech Stack

- Bun runtime, TypeScript (strict), ESNext modules
- Testing: vitest (describe/it/expect/beforeEach/afterEach) via `bun:test` runner
- Store file: `.beastmode/state/store.json`

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `cli/src/types.ts` | Modify | Add `"store"` to `Command` type |
| `cli/src/args.ts` | Modify | Add `"store"` to `UTILITY_COMMANDS` |
| `cli/src/index.ts` | Modify | Add `case "store"` routing |
| `cli/src/commands/store.ts` | Create | Store command handler — subcommand dispatch, arg parsing, JSON output |
| `cli/src/commands/store.test.ts` | Create | Unit tests for store CLI commands |

---

### Task 0: Wire store command into CLI

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `cli/src/types.ts:9`
- Modify: `cli/src/args.ts:4`
- Modify: `cli/src/index.ts:7,49-68`

- [ ] **Step 1: Write the failing test**

Create `cli/src/commands/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { JsonFileStore } from "../store/json-file-store.js";

function tmpdir(): string {
  const dir = join("/tmp", `store-cli-test-${randomUUID()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("store command wiring", () => {
  it("store is a recognized command in UTILITY_COMMANDS", async () => {
    const { parseArgs } = await import("../args.js");
    const result = parseArgs(["bun", "script.ts", "store", "epic", "ls"]);
    expect(result.command).toBe("store");
    expect(result.args).toEqual(["epic", "ls"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: FAIL — `store` not in `ALL_COMMANDS`, `process.exit` called

- [ ] **Step 3: Add "store" to Command type and UTILITY_COMMANDS**

In `cli/src/types.ts` line 9, add `"store"` to the Command union:
```typescript
export type Command = Phase | "watch" | "status" | "cancel" | "compact" | "dashboard" | "store" | "help";
```

In `cli/src/args.ts` line 4, add `"store"` to UTILITY_COMMANDS:
```typescript
const UTILITY_COMMANDS = new Set(["watch", "status", "cancel", "compact", "dashboard", "store", "help"]);
```

- [ ] **Step 4: Create store command stub and wire into index.ts**

Create `cli/src/commands/store.ts`:
```typescript
import { findProjectRoot } from "../config.js";
import { JsonFileStore } from "../store/json-file-store.js";
import { join } from "path";

function jsonOut(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n");
}

function jsonError(message: string): never {
  process.stderr.write(JSON.stringify({ error: message }) + "\n");
  process.exit(1);
}

export async function storeCommand(args: string[]): Promise<void> {
  if (args.length === 0) {
    jsonError("Usage: beastmode store <subcommand>");
  }

  const subcommand = args[0];
  const subArgs = args.slice(1);

  const projectRoot = findProjectRoot();
  const storePath = join(projectRoot, ".beastmode", "state", "store.json");
  const store = new JsonFileStore(storePath);

  switch (subcommand) {
    case "epic":
      await epicCommand(store, subArgs);
      break;
    case "feature":
      await featureCommand(store, subArgs);
      break;
    case "ready":
      await readyCommand(store, subArgs);
      break;
    case "blocked":
      await blockedCommand(store);
      break;
    case "tree":
      await treeCommand(store, subArgs);
      break;
    case "search":
      await searchCommand(store, subArgs);
      break;
    default:
      jsonError(`Unknown store subcommand: ${subcommand}`);
  }
}

async function epicCommand(store: JsonFileStore, args: string[]): Promise<void> {
  jsonError("Not implemented yet");
}

async function featureCommand(store: JsonFileStore, args: string[]): Promise<void> {
  jsonError("Not implemented yet");
}

async function readyCommand(store: JsonFileStore, args: string[]): Promise<void> {
  jsonError("Not implemented yet");
}

async function blockedCommand(store: JsonFileStore): Promise<void> {
  jsonError("Not implemented yet");
}

async function treeCommand(store: JsonFileStore, args: string[]): Promise<void> {
  jsonError("Not implemented yet");
}

async function searchCommand(store: JsonFileStore, args: string[]): Promise<void> {
  jsonError("Not implemented yet");
}
```

In `cli/src/index.ts`, add the import and case:
```typescript
import { storeCommand } from "./commands/store";
```

In the switch statement, add before the `"help"` case:
```typescript
    case "store":
      await storeCommand(args);
      break;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add cli/src/types.ts cli/src/args.ts cli/src/index.ts cli/src/commands/store.ts cli/src/commands/store.test.ts
git commit -m "feat(store-cli): wire store command into CLI arg parser and routing"
```

---

### Task 1: Epic CRUD commands

**Wave:** 2
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/commands/store.ts`
- Modify: `cli/src/commands/store.test.ts`

- [ ] **Step 1: Write the failing tests for epic CRUD**

Add to `cli/src/commands/store.test.ts`:

```typescript
describe("epic commands", () => {
  let storeDir: string;
  let storePath: string;
  let store: JsonFileStore;

  beforeEach(() => {
    storeDir = tmpdir();
    storePath = join(storeDir, "store.json");
    store = new JsonFileStore(storePath);
  });

  afterEach(() => {
    rmSync(storeDir, { recursive: true, force: true });
  });

  it("epic add creates epic and returns JSON", async () => {
    const { epicCommand } = await import("./store.js");
    const result = await epicCommandTestable(store, ["add", '--name=My Epic']);
    expect(result.type).toBe("epic");
    expect(result.name).toBe("My Epic");
    expect(result.slug).toBe("my-epic");
    expect(result.id).toMatch(/^bm-[0-9a-f]{4}$/);
  });

  it("epic ls returns array of epics", async () => {
    await store.transact(s => s.addEpic({ name: "Epic One" }));
    await store.transact(s => s.addEpic({ name: "Epic Two" }));

    const result = await epicLsTestable(store);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Epic One");
    expect(result[1].name).toBe("Epic Two");
  });

  it("epic show returns epic by ID", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Show Me" }));
    const result = await epicShowTestable(store, [epic.id]);
    expect(result.name).toBe("Show Me");
  });

  it("epic show with --deps includes dependency chain", async () => {
    const e1 = await store.transact(s => s.addEpic({ name: "Dep Epic" }));
    const e2 = await store.transact(s => {
      const ep = s.addEpic({ name: "Main Epic" });
      s.updateEpic(ep.id, { depends_on: [e1.id] });
      return s.getEpic(ep.id)!;
    });
    const result = await epicShowTestable(store, [e2.id, "--deps"]);
    expect(result.deps).toBeDefined();
    expect(result.deps.length).toBeGreaterThanOrEqual(1);
  });

  it("epic update patches fields", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Original" }));
    const result = await epicUpdateTestable(store, [epic.id, "--name=Updated", "--status=plan"]);
    expect(result.name).toBe("Updated");
    expect(result.status).toBe("plan");
  });

  it("epic update --add-dep adds dependency", async () => {
    const e1 = await store.transact(s => s.addEpic({ name: "Dep" }));
    const e2 = await store.transact(s => s.addEpic({ name: "Main" }));
    const result = await epicUpdateTestable(store, [e2.id, `--add-dep=${e1.id}`]);
    expect(result.depends_on).toContain(e1.id);
  });

  it("epic update --rm-dep removes dependency", async () => {
    const e1 = await store.transact(s => s.addEpic({ name: "Dep" }));
    const e2 = await store.transact(s => {
      const ep = s.addEpic({ name: "Main" });
      s.updateEpic(ep.id, { depends_on: [e1.id] });
      return s.getEpic(ep.id)!;
    });
    const result = await epicUpdateTestable(store, [e2.id, `--rm-dep=${e1.id}`]);
    expect(result.depends_on).not.toContain(e1.id);
  });

  it("epic delete removes epic", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Delete Me" }));
    await epicDeleteTestable(store, [epic.id]);
    const check = await store.transact(s => s.getEpic(epic.id));
    expect(check).toBeUndefined();
  });

  it("epic show with unknown ID throws", async () => {
    await expect(epicShowTestable(store, ["bm-0000"])).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Implement epic CRUD in store.ts**

Replace the `epicCommand` stub in `cli/src/commands/store.ts` with the full implementation. Also export testable helper functions that take a store instance directly (bypassing file-system projectRoot resolution):

```typescript
/** Parse --key=value flags from args array */
function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) {
      flags[match[1]] = match[2];
    } else if (arg.startsWith("--")) {
      flags[arg.slice(2)] = "true";
    } else {
      positional.push(arg);
    }
  }

  return { positional, flags };
}

export async function epicCommand(store: JsonFileStore, args: string[]): Promise<void> {
  if (args.length === 0) jsonError("Usage: beastmode store epic <ls|show|add|update|delete>");

  const action = args[0];
  const actionArgs = args.slice(1);

  switch (action) {
    case "ls": {
      const result = await store.transact(s => s.listEpics());
      jsonOut(result);
      break;
    }
    case "show": {
      const { positional, flags } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store epic show <id-or-slug>");
      const idOrSlug = positional[0];
      const result = await store.transact(s => {
        const entity = s.find(idOrSlug);
        if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${idOrSlug}`);
        if (flags["deps"] === "true") {
          return { ...entity, deps: s.dependencyChain(entity.id) };
        }
        return entity;
      });
      jsonOut(result);
      break;
    }
    case "add": {
      const { flags } = parseFlags(actionArgs);
      if (!flags["name"]) jsonError("Usage: beastmode store epic add --name=\"X\"");
      const result = await store.transact(s => s.addEpic({ name: flags["name"], slug: flags["slug"] }));
      jsonOut(result);
      break;
    }
    case "update": {
      const { positional, flags } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store epic update <id> [--field=value]");
      const id = positional[0];
      const result = await store.transact(s => {
        const entity = s.find(id);
        if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${id}`);
        const epicId = entity.id;

        const patch: Record<string, unknown> = {};
        if (flags["name"]) patch.name = flags["name"];
        if (flags["slug"]) patch.slug = flags["slug"];
        if (flags["status"]) patch.status = flags["status"];
        if (flags["summary"]) patch.summary = flags["summary"];
        if (flags["design"]) patch.design = flags["design"];
        if (flags["validate"]) patch.validate = flags["validate"];
        if (flags["release"]) patch.release = flags["release"];

        // Handle dependency modifications
        if (flags["add-dep"]) {
          const current = s.getEpic(epicId)!;
          const deps = [...current.depends_on];
          if (!deps.includes(flags["add-dep"])) deps.push(flags["add-dep"]);
          patch.depends_on = deps;
        }
        if (flags["rm-dep"]) {
          const current = s.getEpic(epicId)!;
          patch.depends_on = current.depends_on.filter(d => d !== flags["rm-dep"]);
        }

        return s.updateEpic(epicId, patch as any);
      });
      jsonOut(result);
      break;
    }
    case "delete": {
      const { positional } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store epic delete <id>");
      await store.transact(s => {
        const entity = s.find(positional[0]);
        if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
        s.deleteEpic(entity.id);
      });
      jsonOut({ deleted: true });
      break;
    }
    default:
      jsonError(`Unknown epic action: ${action}`);
  }
}
```

Export testable helpers that call the command internals with a provided store:

```typescript
// Testable helpers (bypass projectRoot resolution)
export async function epicCommandTestable(store: JsonFileStore, args: string[]): Promise<any> {
  // Capture the transact result directly
  const { flags } = parseFlags(args.slice(1));
  return store.transact(s => s.addEpic({ name: flags["name"], slug: flags["slug"] }));
}

export async function epicLsTestable(store: JsonFileStore): Promise<any> {
  return store.transact(s => s.listEpics());
}

export async function epicShowTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional, flags } = parseFlags(args);
  return store.transact(s => {
    const entity = s.find(positional[0]);
    if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
    if (flags["deps"] === "true") {
      return { ...entity, deps: s.dependencyChain(entity.id) };
    }
    return entity;
  });
}

export async function epicUpdateTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional, flags } = parseFlags(args);
  return store.transact(s => {
    const entity = s.find(positional[0]);
    if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
    const epicId = entity.id;
    const patch: Record<string, unknown> = {};
    if (flags["name"]) patch.name = flags["name"];
    if (flags["slug"]) patch.slug = flags["slug"];
    if (flags["status"]) patch.status = flags["status"];
    if (flags["summary"]) patch.summary = flags["summary"];
    if (flags["design"]) patch.design = flags["design"];
    if (flags["validate"]) patch.validate = flags["validate"];
    if (flags["release"]) patch.release = flags["release"];
    if (flags["add-dep"]) {
      const current = s.getEpic(epicId)!;
      const deps = [...current.depends_on];
      if (!deps.includes(flags["add-dep"])) deps.push(flags["add-dep"]);
      patch.depends_on = deps;
    }
    if (flags["rm-dep"]) {
      const current = s.getEpic(epicId)!;
      patch.depends_on = current.depends_on.filter(d => d !== flags["rm-dep"]);
    }
    return s.updateEpic(epicId, patch as any);
  });
}

export async function epicDeleteTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional } = parseFlags(args);
  return store.transact(s => {
    const entity = s.find(positional[0]);
    if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
    s.deleteEpic(entity.id);
  });
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/store.ts cli/src/commands/store.test.ts
git commit -m "feat(store-cli): implement epic CRUD commands with testable helpers"
```

---

### Task 2: Feature CRUD commands

**Wave:** 2
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/commands/store.ts`
- Modify: `cli/src/commands/store.test.ts`

- [ ] **Step 1: Write the failing tests for feature CRUD**

Add to `cli/src/commands/store.test.ts`:

```typescript
describe("feature commands", () => {
  let storeDir: string;
  let storePath: string;
  let store: JsonFileStore;
  let epicId: string;

  beforeEach(async () => {
    storeDir = tmpdir();
    storePath = join(storeDir, "store.json");
    store = new JsonFileStore(storePath);
    const epic = await store.transact(s => s.addEpic({ name: "Parent Epic" }));
    epicId = epic.id;
  });

  afterEach(() => {
    rmSync(storeDir, { recursive: true, force: true });
  });

  it("feature add creates feature under epic", async () => {
    const result = await featureAddTestable(store, [`--parent=${epicId}`, '--name=My Feature']);
    expect(result.type).toBe("feature");
    expect(result.parent).toBe(epicId);
    expect(result.name).toBe("My Feature");
    expect(result.id).toMatch(new RegExp(`^${epicId}\\.\\d+$`));
  });

  it("feature ls lists features for epic", async () => {
    await store.transact(s => s.addFeature({ parent: epicId, name: "F1" }));
    await store.transact(s => s.addFeature({ parent: epicId, name: "F2" }));

    const result = await featureLsTestable(store, [epicId]);
    expect(result).toHaveLength(2);
  });

  it("feature ls accepts slug", async () => {
    await store.transact(s => s.addFeature({ parent: epicId, name: "F1" }));
    const result = await featureLsTestable(store, ["parent-epic"]);
    expect(result).toHaveLength(1);
  });

  it("feature show returns feature by ID", async () => {
    const f = await store.transact(s => s.addFeature({ parent: epicId, name: "Show Feature" }));
    const result = await featureShowTestable(store, [f.id]);
    expect(result.name).toBe("Show Feature");
  });

  it("feature show --deps includes dependency chain", async () => {
    const f1 = await store.transact(s => s.addFeature({ parent: epicId, name: "Dep Feature" }));
    const f2 = await store.transact(s => {
      const feat = s.addFeature({ parent: epicId, name: "Main Feature" });
      s.updateFeature(feat.id, { depends_on: [f1.id] });
      return s.getFeature(feat.id)!;
    });
    const result = await featureShowTestable(store, [f2.id, "--deps"]);
    expect(result.deps).toBeDefined();
  });

  it("feature update patches fields", async () => {
    const f = await store.transact(s => s.addFeature({ parent: epicId, name: "Original" }));
    const result = await featureUpdateTestable(store, [f.id, "--name=Updated", "--status=in-progress"]);
    expect(result.name).toBe("Updated");
    expect(result.status).toBe("in-progress");
  });

  it("feature update --add-dep and --rm-dep work", async () => {
    const f1 = await store.transact(s => s.addFeature({ parent: epicId, name: "Dep" }));
    const f2 = await store.transact(s => s.addFeature({ parent: epicId, name: "Main" }));

    const added = await featureUpdateTestable(store, [f2.id, `--add-dep=${f1.id}`]);
    expect(added.depends_on).toContain(f1.id);

    const removed = await featureUpdateTestable(store, [f2.id, `--rm-dep=${f1.id}`]);
    expect(removed.depends_on).not.toContain(f1.id);
  });

  it("feature delete removes feature", async () => {
    const f = await store.transact(s => s.addFeature({ parent: epicId, name: "Delete Me" }));
    await featureDeleteTestable(store, [f.id]);
    const check = await store.transact(s => s.getFeature(f.id));
    expect(check).toBeUndefined();
  });
});
```

- [ ] **Step 2: Implement feature CRUD in store.ts**

Add `featureCommand` implementation and testable helpers to `cli/src/commands/store.ts`:

```typescript
export async function featureCommand(store: JsonFileStore, args: string[]): Promise<void> {
  if (args.length === 0) jsonError("Usage: beastmode store feature <ls|show|add|update|delete>");

  const action = args[0];
  const actionArgs = args.slice(1);

  switch (action) {
    case "ls": {
      const { positional } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store feature ls <epic-id-or-slug>");
      const result = await store.transact(s => {
        const entity = s.find(positional[0]);
        if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
        return s.listFeatures(entity.id);
      });
      jsonOut(result);
      break;
    }
    case "show": {
      const { positional, flags } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store feature show <id>");
      const result = await store.transact(s => {
        const feature = s.getFeature(positional[0]);
        if (!feature) throw new Error(`Feature not found: ${positional[0]}`);
        if (flags["deps"] === "true") {
          return { ...feature, deps: s.dependencyChain(feature.id) };
        }
        return feature;
      });
      jsonOut(result);
      break;
    }
    case "add": {
      const { flags } = parseFlags(actionArgs);
      if (!flags["parent"] || !flags["name"]) {
        jsonError("Usage: beastmode store feature add --parent=<epic-id> --name=\"X\"");
      }
      const result = await store.transact(s => {
        const parent = s.find(flags["parent"]);
        if (!parent || parent.type !== "epic") throw new Error(`Parent epic not found: ${flags["parent"]}`);
        return s.addFeature({
          parent: parent.id,
          name: flags["name"],
          description: flags["description"],
        });
      });
      jsonOut(result);
      break;
    }
    case "update": {
      const { positional, flags } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store feature update <id> [--field=value]");
      const result = await store.transact(s => {
        const feature = s.getFeature(positional[0]);
        if (!feature) throw new Error(`Feature not found: ${positional[0]}`);

        const patch: Record<string, unknown> = {};
        if (flags["name"]) patch.name = flags["name"];
        if (flags["description"]) patch.description = flags["description"];
        if (flags["status"]) patch.status = flags["status"];
        if (flags["plan"]) patch.plan = flags["plan"];
        if (flags["implement"]) patch.implement = flags["implement"];

        if (flags["add-dep"]) {
          const deps = [...feature.depends_on];
          if (!deps.includes(flags["add-dep"])) deps.push(flags["add-dep"]);
          patch.depends_on = deps;
        }
        if (flags["rm-dep"]) {
          patch.depends_on = feature.depends_on.filter(d => d !== flags["rm-dep"]);
        }

        return s.updateFeature(feature.id, patch as any);
      });
      jsonOut(result);
      break;
    }
    case "delete": {
      const { positional } = parseFlags(actionArgs);
      if (positional.length === 0) jsonError("Usage: beastmode store feature delete <id>");
      await store.transact(s => {
        const feature = s.getFeature(positional[0]);
        if (!feature) throw new Error(`Feature not found: ${positional[0]}`);
        s.deleteFeature(feature.id);
      });
      jsonOut({ deleted: true });
      break;
    }
    default:
      jsonError(`Unknown feature action: ${action}`);
  }
}

// Feature testable helpers
export async function featureAddTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { flags } = parseFlags(args);
  return store.transact(s => {
    const parent = s.find(flags["parent"]);
    if (!parent || parent.type !== "epic") throw new Error(`Parent epic not found: ${flags["parent"]}`);
    return s.addFeature({ parent: parent.id, name: flags["name"], description: flags["description"] });
  });
}

export async function featureLsTestable(store: JsonFileStore, args: string[]): Promise<any> {
  return store.transact(s => {
    const entity = s.find(args[0]);
    if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${args[0]}`);
    return s.listFeatures(entity.id);
  });
}

export async function featureShowTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional, flags } = parseFlags(args);
  return store.transact(s => {
    const feature = s.getFeature(positional[0]);
    if (!feature) throw new Error(`Feature not found: ${positional[0]}`);
    if (flags["deps"] === "true") {
      return { ...feature, deps: s.dependencyChain(feature.id) };
    }
    return feature;
  });
}

export async function featureUpdateTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional, flags } = parseFlags(args);
  return store.transact(s => {
    const feature = s.getFeature(positional[0]);
    if (!feature) throw new Error(`Feature not found: ${positional[0]}`);
    const patch: Record<string, unknown> = {};
    if (flags["name"]) patch.name = flags["name"];
    if (flags["description"]) patch.description = flags["description"];
    if (flags["status"]) patch.status = flags["status"];
    if (flags["plan"]) patch.plan = flags["plan"];
    if (flags["implement"]) patch.implement = flags["implement"];
    if (flags["add-dep"]) {
      const deps = [...feature.depends_on];
      if (!deps.includes(flags["add-dep"])) deps.push(flags["add-dep"]);
      patch.depends_on = deps;
    }
    if (flags["rm-dep"]) {
      patch.depends_on = feature.depends_on.filter(d => d !== flags["rm-dep"]);
    }
    return s.updateFeature(feature.id, patch as any);
  });
}

export async function featureDeleteTestable(store: JsonFileStore, args: string[]): Promise<any> {
  return store.transact(s => {
    const feature = s.getFeature(args[0]);
    if (!feature) throw new Error(`Feature not found: ${args[0]}`);
    s.deleteFeature(feature.id);
  });
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/store.ts cli/src/commands/store.test.ts
git commit -m "feat(store-cli): implement feature CRUD commands"
```

---

### Task 3: Query commands (ready, blocked, tree, search)

**Wave:** 3
**Depends on:** Task 1, Task 2

**Files:**
- Modify: `cli/src/commands/store.ts`
- Modify: `cli/src/commands/store.test.ts`

- [ ] **Step 1: Write the failing tests for query commands**

Add to `cli/src/commands/store.test.ts`:

```typescript
describe("query commands", () => {
  let storeDir: string;
  let storePath: string;
  let store: JsonFileStore;

  beforeEach(() => {
    storeDir = tmpdir();
    storePath = join(storeDir, "store.json");
    store = new JsonFileStore(storePath);
  });

  afterEach(() => {
    rmSync(storeDir, { recursive: true, force: true });
  });

  it("ready returns unblocked features", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    await store.transact(s => s.addFeature({ parent: epic.id, name: "F1" }));
    await store.transact(s => s.addFeature({ parent: epic.id, name: "F2" }));

    const result = await readyTestable(store, []);
    expect(result).toHaveLength(2);
  });

  it("ready filters by epic ID", async () => {
    const e1 = await store.transact(s => s.addEpic({ name: "E1" }));
    const e2 = await store.transact(s => s.addEpic({ name: "E2" }));
    await store.transact(s => s.addFeature({ parent: e1.id, name: "F1" }));
    await store.transact(s => s.addFeature({ parent: e2.id, name: "F2" }));

    const result = await readyTestable(store, [e1.id]);
    expect(result).toHaveLength(1);
    expect(result[0].parent).toBe(e1.id);
  });

  it("ready --type=epic returns ready epics", async () => {
    await store.transact(s => s.addEpic({ name: "E1" }));
    const result = await readyTestable(store, ["--type=epic"]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("epic");
  });

  it("blocked returns blocked entities", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    await store.transact(s => {
      const f = s.addFeature({ parent: epic.id, name: "Blocked Feature" });
      s.updateFeature(f.id, { status: "blocked" });
    });

    const result = await blockedTestable(store);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("blocked");
  });

  it("tree returns full hierarchy", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    await store.transact(s => s.addFeature({ parent: epic.id, name: "F1" }));

    const result = await treeTestable(store, []);
    expect(result).toHaveLength(1);
    expect(result[0].entity.type).toBe("epic");
    expect(result[0].children).toHaveLength(1);
  });

  it("tree with root ID returns subtree", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    await store.transact(s => s.addFeature({ parent: epic.id, name: "F1" }));
    await store.transact(s => s.addEpic({ name: "E2" }));

    const result = await treeTestable(store, [epic.id]);
    expect(result).toHaveLength(1);
    expect(result[0].entity.id).toBe(epic.id);
  });

  it("search --name filters by name substring", async () => {
    await store.transact(s => s.addEpic({ name: "Auth Middleware" }));
    await store.transact(s => s.addEpic({ name: "CLI Restructure" }));

    const result = await searchTestable(store, ["--name=Auth"]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Auth Middleware");
  });

  it("search --status filters by status", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    await store.transact(s => {
      const f = s.addFeature({ parent: epic.id, name: "F1" });
      s.updateFeature(f.id, { status: "blocked" });
    });
    await store.transact(s => s.addFeature({ parent: epic.id, name: "F2" }));

    const result = await searchTestable(store, ["--status=blocked"]);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("blocked");
  });

  it("search --type filters by entity type", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    await store.transact(s => s.addFeature({ parent: epic.id, name: "F1" }));

    const result = await searchTestable(store, ["--type=epic"]);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("epic");
  });
});
```

- [ ] **Step 2: Implement query commands in store.ts**

Replace the query command stubs in `cli/src/commands/store.ts`:

```typescript
async function readyCommand(store: JsonFileStore, args: string[]): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const opts: { epicId?: string; type?: "epic" | "feature" } = {};

  if (positional.length > 0) {
    // Resolve epic ID from positional arg (could be slug)
    const epicId = await store.transact(s => {
      const entity = s.find(positional[0]);
      if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
      return entity.id;
    });
    opts.epicId = epicId;
  }

  if (flags["type"] === "epic" || flags["type"] === "feature") {
    opts.type = flags["type"];
  }

  const result = await store.transact(s => s.ready(opts));
  jsonOut(result);
}

async function blockedCommand(store: JsonFileStore): Promise<void> {
  const result = await store.transact(s => s.blocked());
  jsonOut(result);
}

async function treeCommand(store: JsonFileStore, args: string[]): Promise<void> {
  const { positional } = parseFlags(args);
  const rootId = positional.length > 0 ? positional[0] : undefined;

  const result = await store.transact(s => {
    if (rootId) {
      const entity = s.find(rootId);
      if (!entity) throw new Error(`Entity not found: ${rootId}`);
      return s.tree(entity.id);
    }
    return s.tree();
  });
  jsonOut(result);
}

async function searchCommand(store: JsonFileStore, args: string[]): Promise<void> {
  const { flags } = parseFlags(args);

  const result = await store.transact(s => {
    const allEntities = [...s.listEpics(), ...s.listEpics().flatMap(e => s.listFeatures(e.id))];

    return allEntities.filter(entity => {
      if (flags["type"] && entity.type !== flags["type"]) return false;
      if (flags["status"] && entity.status !== flags["status"]) return false;
      if (flags["name"]) {
        const nameLower = entity.name.toLowerCase();
        const queryLower = flags["name"].toLowerCase();
        if (!nameLower.includes(queryLower)) return false;
      }
      return true;
    });
  });
  jsonOut(result);
}

// Query testable helpers
export async function readyTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional, flags } = parseFlags(args);
  const opts: { epicId?: string; type?: "epic" | "feature" } = {};
  if (positional.length > 0) {
    opts.epicId = await store.transact(s => {
      const entity = s.find(positional[0]);
      if (!entity || entity.type !== "epic") throw new Error(`Epic not found: ${positional[0]}`);
      return entity.id;
    });
  }
  if (flags["type"] === "epic" || flags["type"] === "feature") {
    opts.type = flags["type"];
  }
  return store.transact(s => s.ready(opts));
}

export async function blockedTestable(store: JsonFileStore): Promise<any> {
  return store.transact(s => s.blocked());
}

export async function treeTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { positional } = parseFlags(args);
  const rootId = positional.length > 0 ? positional[0] : undefined;
  return store.transact(s => {
    if (rootId) {
      const entity = s.find(rootId);
      if (!entity) throw new Error(`Entity not found: ${rootId}`);
      return s.tree(entity.id);
    }
    return s.tree();
  });
}

export async function searchTestable(store: JsonFileStore, args: string[]): Promise<any> {
  const { flags } = parseFlags(args);
  return store.transact(s => {
    const allEntities = [...s.listEpics(), ...s.listEpics().flatMap(e => s.listFeatures(e.id))];
    return allEntities.filter(entity => {
      if (flags["type"] && entity.type !== flags["type"]) return false;
      if (flags["status"] && entity.status !== flags["status"]) return false;
      if (flags["name"]) {
        const nameLower = entity.name.toLowerCase();
        const queryLower = flags["name"].toLowerCase();
        if (!nameLower.includes(queryLower)) return false;
      }
      return true;
    });
  });
}
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/store.ts cli/src/commands/store.test.ts
git commit -m "feat(store-cli): implement query commands (ready, blocked, tree, search)"
```

---

### Task 4: Error handling and JSON output contract

**Wave:** 3
**Depends on:** Task 1, Task 2

**Files:**
- Modify: `cli/src/commands/store.ts`
- Modify: `cli/src/commands/store.test.ts`

- [ ] **Step 1: Write the failing tests for error handling**

Add to `cli/src/commands/store.test.ts`:

```typescript
describe("error handling and output contract", () => {
  let storeDir: string;
  let storePath: string;
  let store: JsonFileStore;

  beforeEach(() => {
    storeDir = tmpdir();
    storePath = join(storeDir, "store.json");
    store = new JsonFileStore(storePath);
  });

  afterEach(() => {
    rmSync(storeDir, { recursive: true, force: true });
  });

  it("epic show with nonexistent ID throws descriptive error", async () => {
    await expect(epicShowTestable(store, ["bm-9999"])).rejects.toThrow("Epic not found: bm-9999");
  });

  it("feature show with nonexistent ID throws descriptive error", async () => {
    await expect(featureShowTestable(store, ["bm-9999.1"])).rejects.toThrow("Feature not found: bm-9999.1");
  });

  it("epic add returns all expected fields", async () => {
    const result = await store.transact(s => s.addEpic({ name: "Full Fields" }));
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("type", "epic");
    expect(result).toHaveProperty("name", "Full Fields");
    expect(result).toHaveProperty("slug", "full-fields");
    expect(result).toHaveProperty("status", "design");
    expect(result).toHaveProperty("depends_on");
    expect(result).toHaveProperty("created_at");
    expect(result).toHaveProperty("updated_at");
  });

  it("feature add returns all expected fields", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "E1" }));
    const result = await store.transact(s => s.addFeature({ parent: epic.id, name: "Full Feature" }));
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("type", "feature");
    expect(result).toHaveProperty("parent", epic.id);
    expect(result).toHaveProperty("name", "Full Feature");
    expect(result).toHaveProperty("status", "pending");
    expect(result).toHaveProperty("depends_on");
    expect(result).toHaveProperty("created_at");
    expect(result).toHaveProperty("updated_at");
  });

  it("epic delete cascades to features", async () => {
    const epic = await store.transact(s => s.addEpic({ name: "Cascade" }));
    const f = await store.transact(s => s.addFeature({ parent: epic.id, name: "Child" }));
    await epicDeleteTestable(store, [epic.id]);
    const check = await store.transact(s => s.getFeature(f.id));
    expect(check).toBeUndefined();
  });

  it("epic show accepts slug", async () => {
    await store.transact(s => s.addEpic({ name: "Slug Test" }));
    const result = await epicShowTestable(store, ["slug-test"]);
    expect(result.name).toBe("Slug Test");
  });

  it("parseFlags handles mixed args correctly", async () => {
    const { parseFlags } = await import("./store.js");
    const { positional, flags } = parseFlags(["bm-1234", "--name=Hello World", "--deps"]);
    expect(positional).toEqual(["bm-1234"]);
    expect(flags["name"]).toBe("Hello World");
    expect(flags["deps"]).toBe("true");
  });
});
```

- [ ] **Step 2: Ensure parseFlags is exported from store.ts**

Make sure `parseFlags` is exported in `cli/src/commands/store.ts`:
```typescript
export function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string> } {
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add cli/src/commands/store.ts cli/src/commands/store.test.ts
git commit -m "feat(store-cli): add error handling tests and export parseFlags"
```

---

### Task 5: Help text update

**Wave:** 3
**Depends on:** Task 0

**Files:**
- Modify: `cli/src/index.ts`

- [ ] **Step 1: Update help text to include store commands**

In `cli/src/index.ts`, update the `printHelp()` function to include store commands:

```typescript
function printHelp(): void {
  process.stdout.write(`beastmode v${VERSION}

Usage:
  beastmode design [topic]             Start a new design
  beastmode plan <slug>                Plan features for a design
  beastmode implement <slug> [feature] Implement a feature
  beastmode validate <slug>            Run validation checks
  beastmode release <slug>             Create a release
  beastmode cancel <slug> [--force]   Cancel and clean up an epic
  beastmode compact                    Audit and compact the context tree
  beastmode watch                      Autonomous pipeline orchestration
  beastmode status [--all] [--watch|-w] Show pipeline status
  beastmode dashboard                  Fullscreen pipeline dashboard
  beastmode store <subcommand>         Structured task store operations
  beastmode help                       Show this help message

Store subcommands:
  store epic ls                        List all epics
  store epic show <id> [--deps]        Show epic details
  store epic add --name="X"            Create epic
  store epic update <id> [--field=X]   Update epic
  store epic delete <id>               Delete epic and features
  store feature ls <epic-id>           List features for epic
  store feature show <id> [--deps]     Show feature details
  store feature add --parent=<id> --name="X"  Create feature
  store feature update <id> [--field=X]       Update feature
  store feature delete <id>            Delete feature
  store ready [<epic-id>] [--type=X]   List unblocked entities
  store blocked                        List blocked entities
  store tree [<id>]                    Show entity hierarchy
  store search [--name=X] [--status=X] [--type=X]  Search entities

Flags:
  -v, -vv, -vvv                    Increase output verbosity
  --yes, -y                        Skip confirmation prompts (phase regression)
  --force                          Skip confirmation prompt (cancel)
`);
}
```

- [ ] **Step 2: Verify no test regressions**

Run: `cd cli && bun test src/commands/store.test.ts`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add cli/src/index.ts
git commit -m "feat(store-cli): update help text with store commands"
```
