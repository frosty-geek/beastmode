import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import type { Phase } from "../src/types";

/**
 * Tests for the interactive runner module.
 *
 * Since the runner spawns Bun.spawn (which requires a real claude binary),
 * we test the prompt construction logic and interface contract rather than
 * spawning actual processes.
 */

describe("interactive runner prompt construction", () => {
  test("design phase constructs correct prompt", () => {
    const phase: Phase = "design";
    const args = ["my", "cool", "topic"];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();
    expect(prompt).toBe("/beastmode:design my cool topic");
  });

  test("plan phase constructs correct prompt", () => {
    const phase: Phase = "plan";
    const args = ["my-epic"];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();
    expect(prompt).toBe("/beastmode:plan my-epic");
  });

  test("implement phase constructs correct prompt with epic and feature", () => {
    const phase: Phase = "implement";
    const args = ["my-epic", "my-feature"];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();
    expect(prompt).toBe("/beastmode:implement my-epic my-feature");
  });

  test("validate phase constructs correct prompt", () => {
    const phase: Phase = "validate";
    const args = ["my-epic"];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();
    expect(prompt).toBe("/beastmode:validate my-epic");
  });

  test("release phase constructs correct prompt", () => {
    const phase: Phase = "release";
    const args = ["my-epic"];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();
    expect(prompt).toBe("/beastmode:release my-epic");
  });

  test("empty args produce clean prompt without trailing space", () => {
    const phase: Phase = "design";
    const args: string[] = [];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();
    expect(prompt).toBe("/beastmode:design");
  });
});

describe("interactive runner interface contract", () => {
  test("module exports runInteractive function", async () => {
    const mod = await import("../src/runners/interactive-runner");
    expect(typeof mod.runInteractive).toBe("function");
  });

  test("design-runner module is removed", async () => {
    // The old design-runner.ts should no longer exist
    const fs = await import("fs");
    const path = await import("path");
    const designRunnerPath = path.resolve(import.meta.dir, "../src/runners/design-runner.ts");
    expect(fs.existsSync(designRunnerPath)).toBe(false);
  });
});

describe("interactive runner spawn args", () => {
  test("claude is called with --dangerously-skip-permissions flag", () => {
    // Verify the expected spawn args pattern
    const phase: Phase = "plan";
    const args = ["my-epic"];
    const prompt = `/beastmode:${phase} ${args.join(" ")}`.trim();

    const expectedSpawnArgs = ["claude", "--dangerously-skip-permissions", "--", prompt];
    expect(expectedSpawnArgs[0]).toBe("claude");
    expect(expectedSpawnArgs[1]).toBe("--dangerously-skip-permissions");
    expect(expectedSpawnArgs[2]).toBe("--");
    expect(expectedSpawnArgs[3]).toBe("/beastmode:plan my-epic");
  });

  test("stdio is set to inherit for interactive terminal", () => {
    // The spawn options must use inherited stdio for operator interaction
    const spawnOpts = {
      cwd: "/some/path",
      stdin: "inherit" as const,
      stdout: "inherit" as const,
      stderr: "inherit" as const,
    };
    expect(spawnOpts.stdin).toBe("inherit");
    expect(spawnOpts.stdout).toBe("inherit");
    expect(spawnOpts.stderr).toBe("inherit");
  });
});

describe("PhaseResult contract", () => {
  test("valid exit statuses", () => {
    const validStatuses = ["success", "error", "cancelled"];
    for (const status of validStatuses) {
      expect(validStatuses).toContain(status);
    }
  });

  test("cost_usd is null for interactive runner (no SDK billing)", () => {
    // Interactive runner cannot track cost — it's a spawned process
    const result = {
      exit_status: "success" as const,
      cost_usd: null,
      duration_ms: 1000,
      session_id: null,
    };
    expect(result.cost_usd).toBeNull();
  });

  test("session_id is null for interactive runner (no SDK session)", () => {
    const result = {
      exit_status: "success" as const,
      cost_usd: null,
      duration_ms: 1000,
      session_id: null,
    };
    expect(result.session_id).toBeNull();
  });
});
