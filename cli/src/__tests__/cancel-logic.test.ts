/**
 * Tests for shared cancel-logic module.
 *
 * Strategy: real filesystem for artifacts (step 4) and manifest (step 6),
 * mock.module for git-dependent operations (steps 1-3) and gh CLI (step 5).
 */
import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { existsSync, rmSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Mock external deps BEFORE importing cancel-logic
// ---------------------------------------------------------------------------

const { mockRemoveWorktree, mockGit, mockDeleteAllTags, mockGh } = vi.hoisted(() => ({
  mockRemoveWorktree: vi.fn(async () => {}),
  mockGit: vi.fn(async () => ({ stdout: "", stderr: "", exitCode: 0 })),
  mockDeleteAllTags: vi.fn(async () => {}),
  mockGh: vi.fn(async () => ({ stdout: "", stderr: "", exitCode: 0 })),
}));

vi.mock("../git/worktree.js", () => ({
  remove: mockRemoveWorktree,
  git: mockGit,
}));
vi.mock("../git/tags.js", () => ({
  deleteAllTags: mockDeleteAllTags,
}));
vi.mock("../github/cli.js", () => ({
  gh: mockGh,
}));

// Import AFTER mocking
import { cancelEpic } from "../commands/cancel-logic.js";
import type { CancelConfig } from "../commands/cancel-logic.js";
import { createNullLogger } from "../logger.js";
import { InMemoryTaskStore } from "../store/in-memory.js";
import type { TaskStore } from "../store/types.js";
import { saveSyncRefs } from "../github/sync-refs.js";

// ---------------------------------------------------------------------------
// Test scaffolding
// ---------------------------------------------------------------------------

const TEST_ROOT = resolve(import.meta.dirname, "../../.test-cancel-logic");

function cleanup(): void {
  if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true });
}

function stateDir(): string {
  return resolve(TEST_ROOT, ".beastmode", "state");
}

function artifactsDir(phase: string): string {
  return resolve(TEST_ROOT, ".beastmode", "artifacts", phase);
}

/** Create an epic entity in the store so cancel-logic can find it. */
function seedManifest(
  slug: string,
  overrides?: { epic?: string; github?: { epic: number; repo: string } },
): { store: TaskStore; epic: any } {
  const store = new InMemoryTaskStore();
  const epicName = overrides?.epic || slug;
  const epic = store.addEpic({ name: epicName, slug: slug });

  // If github override provided, seed sync refs
  if (overrides?.github) {
    saveSyncRefs(TEST_ROOT, {
      [epic.id]: { issue: overrides.github.epic },
    });
  }

  return { store, epic };
}

/** Seed artifact files that should match the epic pattern. */
function seedArtifacts(epic: string, phases: string[] = ["design", "plan"]) {
  const date = new Date().toISOString().slice(0, 10);
  for (const phase of phases) {
    const dir = artifactsDir(phase);
    mkdirSync(dir, { recursive: true });
    // Pattern: contains `-${epic}-` (mid-string)
    writeFileSync(resolve(dir, `${date}-${epic}-research.md`), "content");
    // Pattern: contains `-${epic}.` (end-of-name)
    writeFileSync(resolve(dir, `${date}-${epic}.output.json`), "{}");
  }
}

/** Seed artifact files that should NOT match. */
function seedUnrelatedArtifacts() {
  const dir = artifactsDir("design");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "2026-01-01-other-epic-research.md"), "content");
  writeFileSync(resolve(dir, "2026-01-01-other-epic.output.json"), "{}");
}

function baseConfig(overrides?: Partial<CancelConfig>): CancelConfig {
  return {
    identifier: "my-epic",
    projectRoot: TEST_ROOT,
    githubEnabled: false,
    force: true,
    logger: createNullLogger(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("cancelEpic", () => {
  beforeEach(() => {
    cleanup();
    mkdirSync(stateDir(), { recursive: true });
    mockRemoveWorktree.mockReset();
    mockGit.mockReset();
    mockDeleteAllTags.mockReset();
    mockGh.mockReset();
    // Restore default success behavior after reset
    mockRemoveWorktree.mockImplementation(async () => {});
    mockGit.mockImplementation(async () => ({ stdout: "", stderr: "", exitCode: 0 }));
    mockDeleteAllTags.mockImplementation(async () => {});
    mockGh.mockImplementation(async () => ({ stdout: "", stderr: "", exitCode: 0 }));
  });
  afterEach(() => cleanup());

  // -----------------------------------------------------------------------
  // 1. Full cleanup sequence
  // -----------------------------------------------------------------------
  test("full cleanup — all 6 steps succeed", async () => {
    const { store } = seedManifest("my-epic");

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.cleaned).toContain("worktree");
    expect(result.cleaned).toContain("archive-tag");
    expect(result.cleaned).toContain("phase-tags");
    expect(result.cleaned).toContain("artifacts");
    expect(result.cleaned).toContain("store-entity");
    expect(result.warned).toHaveLength(0);
    expect(result.cleaned).toHaveLength(5); // no github-issue (disabled)
  });

  test("full cleanup with github enabled — all 6 steps succeed", async () => {
    const { store } = seedManifest("my-epic", { github: { epic: 42, repo: "org/repo" } });

    const result = await cancelEpic(
      baseConfig({ githubEnabled: true, taskStore: store }),
    );

    expect(result.cleaned).toContain("worktree");
    expect(result.cleaned).toContain("archive-tag");
    expect(result.cleaned).toContain("phase-tags");
    expect(result.cleaned).toContain("artifacts");
    expect(result.cleaned).toContain("github-issue");
    expect(result.cleaned).toContain("store-entity");
    expect(result.warned).toHaveLength(0);
    expect(result.cleaned).toHaveLength(6);

    // Verify gh() was called correctly
    expect(mockGh).toHaveBeenCalledWith(
      ["issue", "close", "42", "--reason", "not planned"],
      expect.objectContaining({ cwd: TEST_ROOT }),
    );
  });

  // -----------------------------------------------------------------------
  // 2. Idempotent behavior
  // -----------------------------------------------------------------------
  test("idempotent — second cancel succeeds when store entity already gone", async () => {
    const { store } = seedManifest("my-epic");

    // First cancel
    const first = await cancelEpic(baseConfig({ taskStore: store }));
    expect(first.cleaned).toContain("store-entity");

    // Store entity should be gone
    expect(store.find("my-epic")).toBeUndefined();

    // Second cancel — entity not found, artifacts already gone
    const second = await cancelEpic(baseConfig({ taskStore: store }));

    // Should still complete without errors — store-entity step succeeds
    expect(second.cleaned).toContain("store-entity");
    expect(second.warned).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 3. Force flag
  // -----------------------------------------------------------------------
  test("force=true skips confirmation prompt", async () => {
    const { store } = seedManifest("my-epic");

    // force=true is the default in baseConfig — should not hang on stdin
    const result = await cancelEpic(baseConfig({ force: true, taskStore: store }));

    expect(result.cleaned.length).toBeGreaterThan(0);
    expect(result.warned).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 4. Design-abandon calling shared cancel (force=true, most steps no-op)
  // -----------------------------------------------------------------------
  test("design-abandon scenario — no store entity, identifier used as fallback", async () => {
    // No entity created — simulates abandon where design was never completed
    const result = await cancelEpic(
      baseConfig({ identifier: "abandoned-slug", force: true }),
    );

    // All steps should still complete (just with nothing to clean)
    expect(result.cleaned).toContain("worktree");
    expect(result.cleaned).toContain("archive-tag");
    expect(result.cleaned).toContain("phase-tags");
    expect(result.cleaned).toContain("artifacts");
    expect(result.cleaned).toContain("store-entity");
    expect(result.warned).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 5. Manifest-not-found graceful handling
  // -----------------------------------------------------------------------
  test("no store entity — falls back to identifier for slug and epic", async () => {
    // No entity seeded — cancel-logic should use identifier directly
    const result = await cancelEpic(
      baseConfig({ identifier: "raw-ident" }),
    );

    // worktree.remove should be called with the identifier as slug
    expect(mockRemoveWorktree).toHaveBeenCalledWith(
      "raw-ident",
      expect.objectContaining({ cwd: TEST_ROOT, deleteBranch: true }),
    );

    // git tag -d should reference archive/<identifier>
    expect(mockGit).toHaveBeenCalledWith(
      ["tag", "-d", "archive/raw-ident"],
      expect.objectContaining({ cwd: TEST_ROOT }),
    );

    // deleteAllTags should reference the identifier
    expect(mockDeleteAllTags).toHaveBeenCalledWith(
      "raw-ident",
      expect.objectContaining({ cwd: TEST_ROOT }),
    );

    expect(result.cleaned).toContain("worktree");
    expect(result.warned).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // 6. Individual step failure — warn and continue
  // -----------------------------------------------------------------------
  test("worktree removal fails — rest continues, warned[] gets failure", async () => {
    const { store } = seedManifest("my-epic");
    mockRemoveWorktree.mockImplementation(async () => {
      throw new Error("worktree not found");
    });

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.warned).toContain("worktree");
    // All other steps should still succeed
    expect(result.cleaned).toContain("archive-tag");
    expect(result.cleaned).toContain("phase-tags");
    expect(result.cleaned).toContain("artifacts");
    expect(result.cleaned).toContain("store-entity");
    expect(result.cleaned).not.toContain("worktree");
  });

  test("archive tag deletion fails — rest continues", async () => {
    const { store } = seedManifest("my-epic");
    mockGit.mockImplementation(async () => {
      throw new Error("tag not found");
    });

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.warned).toContain("archive-tag");
    expect(result.cleaned).toContain("worktree");
    expect(result.cleaned).toContain("phase-tags");
    expect(result.cleaned).toContain("artifacts");
    expect(result.cleaned).toContain("store-entity");
  });

  test("phase tag deletion fails — rest continues", async () => {
    const { store } = seedManifest("my-epic");
    mockDeleteAllTags.mockImplementation(async () => {
      throw new Error("no tags found");
    });

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.warned).toContain("phase-tags");
    expect(result.cleaned).toContain("worktree");
    expect(result.cleaned).toContain("archive-tag");
    expect(result.cleaned).toContain("artifacts");
    expect(result.cleaned).toContain("store-entity");
  });

  test("store entity deletion fails — added to warned", async () => {
    // Seed entity, then make the store.deleteEpic throw by using a spy
    const { store } = seedManifest("my-epic");

    const deleteEpicSpy = vi.spyOn(store, "deleteEpic").mockImplementation(() => {
      throw new Error("permission denied");
    });

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.warned).toContain("store-entity");
    expect(result.cleaned).not.toContain("store-entity");
    expect(result.cleaned).toContain("worktree");

    deleteEpicSpy.mockRestore();
  });

  // -----------------------------------------------------------------------
  // 7. GitHub close skipped when disabled
  // -----------------------------------------------------------------------
  test("githubEnabled=false skips GitHub close even with epic number", async () => {
    const { store } = seedManifest("my-epic", { github: { epic: 99, repo: "org/repo" } });

    const result = await cancelEpic(
      baseConfig({ githubEnabled: false, taskStore: store }),
    );

    expect(result.cleaned).not.toContain("github-issue");
    expect(result.warned).not.toContain("github-issue");
  });

  test("githubEnabled=true but no epic number — skips GitHub close", async () => {
    // Entity without github.epic
    const { store } = seedManifest("my-epic");

    const result = await cancelEpic(
      baseConfig({ githubEnabled: true, taskStore: store }),
    );

    expect(result.cleaned).not.toContain("github-issue");
    expect(result.warned).not.toContain("github-issue");
  });

  // -----------------------------------------------------------------------
  // 8. Artifact matching patterns
  // -----------------------------------------------------------------------
  test("artifacts with -epic- and -epic. patterns are matched and deleted", async () => {
    const { store } = seedManifest("my-epic", { epic: "my-epic" });
    seedArtifacts("my-epic", ["design", "plan"]);
    seedUnrelatedArtifacts();

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.cleaned).toContain("artifacts");

    // my-epic artifacts should be gone
    const designDir = artifactsDir("design");
    const planDir = artifactsDir("plan");
    const designFiles = readdirSync(designDir);
    const planFiles = readdirSync(planDir);

    // Only unrelated artifacts should remain in design
    expect(designFiles).toHaveLength(2); // other-epic-research.md + other-epic.output.json
    expect(designFiles.every((f) => f.includes("other-epic"))).toBe(true);

    // Plan dir should be empty (only had my-epic files)
    expect(planFiles).toHaveLength(0);
  });

  test("artifact dirs that do not exist are silently skipped", async () => {
    const { store } = seedManifest("my-epic");
    // No artifact directories created at all

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    expect(result.cleaned).toContain("artifacts");
    expect(result.warned).not.toContain("artifacts");
  });

  test("artifacts with different epic name are not deleted", async () => {
    const { store } = seedManifest("my-epic", { epic: "my-epic" });
    seedUnrelatedArtifacts(); // only other-epic files

    const result = await cancelEpic(baseConfig({ taskStore: store }));

    // Should succeed but not delete anything
    expect(result.cleaned).toContain("artifacts");
    const designFiles = readdirSync(artifactsDir("design"));
    expect(designFiles).toHaveLength(2); // both other-epic files intact
  });

  // -----------------------------------------------------------------------
  // Manifest resolution — epic field used for artifact matching
  // -----------------------------------------------------------------------
  test("uses entity name for artifact matching when different from slug", async () => {
    const { store } = seedManifest("hex-abc123", { epic: "real-name" });
    seedArtifacts("real-name", ["design"]);

    // Also seed artifacts matching the slug — should NOT be deleted
    const dir = artifactsDir("design");
    writeFileSync(resolve(dir, "2026-01-01-hex-abc123-notes.md"), "content");

    const result = await cancelEpic(
      baseConfig({ identifier: "hex-abc123", taskStore: store }),
    );

    expect(result.cleaned).toContain("artifacts");

    const remaining = readdirSync(dir);
    // real-name artifacts deleted, hex-abc123 artifact still there
    expect(remaining).toContain("2026-01-01-hex-abc123-notes.md");
    expect(remaining.some((f) => f.includes("real-name"))).toBe(false);
  });
});
