import { describe, test, expect } from "bun:test";
import { composeHitlSettings, writeHitlSettings } from "../hitl-settings";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// --- composeHitlSettings ---

describe("composeHitlSettings", () => {
  test("preserves enabledPlugins from existing settings", () => {
    const existing = { enabledPlugins: { "commons@overrides": true } };
    const result = composeHitlSettings("design", existing);
    expect(result.enabledPlugins).toEqual({ "commons@overrides": true });
  });

  test("adds PostToolUse hook for AskUserQuestion", () => {
    const result = composeHitlSettings("implement", {});
    const hooks = result.hooks as Record<string, unknown[]>;
    expect(hooks.PostToolUse).toHaveLength(1);
    expect(hooks.PostToolUse[0]).toEqual({
      matcher: "AskUserQuestion",
      hooks: [
        {
          type: "command",
          command: expect.stringContaining("hitl-log.ts"),
        },
      ],
    });
  });

  test("templates phase into hook command", () => {
    const result = composeHitlSettings("validate", {});
    const hooks = result.hooks as Record<string, unknown[]>;
    const hook = hooks.PostToolUse[0] as any;
    expect(hook.hooks[0].command).toContain("validate");
  });

  test("replaces hooks on each call (clean slate)", () => {
    const existing = { hooks: { SomeOtherHook: ["old"] } };
    const result = composeHitlSettings("plan", existing);
    const hooks = result.hooks as Record<string, unknown[]>;
    expect(hooks).not.toHaveProperty("SomeOtherHook");
  });
});

// --- writeHitlSettings ---

describe("writeHitlSettings", () => {
  test("writes settings.local.json to worktree", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "beastmode-hitl-"));
    mkdirSync(join(tempDir, ".claude"), { recursive: true });

    writeHitlSettings(tempDir, "design");

    const raw = readFileSync(
      join(tempDir, ".claude", "settings.local.json"),
      "utf-8",
    );
    const parsed = JSON.parse(raw);
    expect(parsed.hooks).toBeDefined();
    expect(parsed.hooks.PostToolUse).toHaveLength(1);
  });

  test("preserves existing settings.local.json content", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "beastmode-hitl-"));
    mkdirSync(join(tempDir, ".claude"), { recursive: true });
    writeFileSync(
      join(tempDir, ".claude", "settings.local.json"),
      JSON.stringify({ enabledPlugins: { "my-plugin": true } }),
    );

    writeHitlSettings(tempDir, "implement");

    const raw = readFileSync(
      join(tempDir, ".claude", "settings.local.json"),
      "utf-8",
    );
    const parsed = JSON.parse(raw);
    expect(parsed.enabledPlugins).toEqual({ "my-plugin": true });
    expect(parsed.hooks.PostToolUse).toHaveLength(1);
  });

  test("creates .claude directory if missing", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "beastmode-hitl-"));
    // No .claude/ directory created

    writeHitlSettings(tempDir, "plan");

    const raw = readFileSync(
      join(tempDir, ".claude", "settings.local.json"),
      "utf-8",
    );
    const parsed = JSON.parse(raw);
    expect(parsed.hooks.PostToolUse).toHaveLength(1);
  });
});
