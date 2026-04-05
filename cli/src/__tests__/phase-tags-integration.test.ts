import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  mkdirSync,
  rmSync,
  existsSync,
} from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { createTag, listTags, renameTags } from "../git/tags";

const TEST_ROOT = resolve(import.meta.dirname, "../../.test-phase-tags-integration");

function cleanup(): void {
  if (existsSync(TEST_ROOT)) {
    try {
      execSync("git worktree prune", { cwd: TEST_ROOT, stdio: "ignore" });
    } catch {}
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }
}

function setupTestRepo(): void {
  cleanup();
  mkdirSync(TEST_ROOT, { recursive: true });
  execSync("git init", { cwd: TEST_ROOT, stdio: "ignore" });
  execSync("git commit --allow-empty -m 'init'", {
    cwd: TEST_ROOT,
    stdio: "ignore",
  });
  mkdirSync(resolve(TEST_ROOT, ".beastmode", "state"), { recursive: true });
  mkdirSync(resolve(TEST_ROOT, ".claude", "worktrees"), { recursive: true });
}

describe("phase-tags integration", () => {
  beforeEach(() => setupTestRepo());
  afterEach(() => cleanup());

  test("renameTags renames phase tags from old slug to new slug", async () => {
    // Create phase tags under the hex slug
    await createTag("abc123", "design", { cwd: TEST_ROOT });

    // Verify tag exists
    let tags = await listTags("abc123", { cwd: TEST_ROOT });
    expect(tags).toContain("beastmode/abc123/design");

    // Rename tags
    await renameTags("abc123", "my-feature", { cwd: TEST_ROOT });

    // Old tags gone, new tags present
    const oldTags = await listTags("abc123", { cwd: TEST_ROOT });
    const newTags = await listTags("my-feature", { cwd: TEST_ROOT });
    expect(oldTags).toHaveLength(0);
    expect(newTags).toContain("beastmode/my-feature/design");
  });

  test("renameTags succeeds even when no tags exist (old epic)", async () => {
    // No tags created — simulates pre-feature epic
    await renameTags("abc123", "my-feature", { cwd: TEST_ROOT });
    // No error thrown — graceful no-op
    const newTags = await listTags("my-feature", { cwd: TEST_ROOT });
    expect(newTags).toHaveLength(0);
  });

  test("multiple phase tags survive rename", async () => {
    await createTag("abc123", "design", { cwd: TEST_ROOT });
    await createTag("abc123", "plan", { cwd: TEST_ROOT });
    await createTag("abc123", "implement", { cwd: TEST_ROOT });

    await renameTags("abc123", "my-feature", { cwd: TEST_ROOT });

    const newTags = await listTags("my-feature", { cwd: TEST_ROOT });
    expect(newTags).toContain("beastmode/my-feature/design");
    expect(newTags).toContain("beastmode/my-feature/plan");
    expect(newTags).toContain("beastmode/my-feature/implement");
    expect(newTags).toHaveLength(3);
  });
});
