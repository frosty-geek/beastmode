/**
 * Unit tests for syncFeature plan reader and buildArtifactsMap logging.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// --- Mock gh CLI ---
vi.mock("../github/cli", () => ({
  ghIssueCreate: async () => 42,
  ghIssueEdit: async () => true,
  ghIssueClose: async () => true,
  ghIssueComment: async () => true,
  ghIssueComments: async () => [],
  ghIssueState: async () => "open",
  ghIssueReopen: async () => true,
  ghIssueLabels: async () => ["type/epic", "phase/design"],
  ghProjectItemAdd: async () => "item-123",
  ghProjectSetField: async () => true,
  ghSubIssueAdd: async () => true,
  ghProjectItemDelete: async () => true,
}));

import { syncGitHub, syncGitHubForEpic, buildArtifactsMap } from "../github/sync";
import type { EpicSyncInput } from "../github/sync";
import type { BeastmodeConfig } from "../config";
import type { ResolvedGitHub } from "../github/discovery";
import type { Logger } from "../logger";

function createSpyLogger(): Logger & { calls: { level: string; msg: string; data?: Record<string, unknown> }[] } {
  const calls: { level: string; msg: string; data?: Record<string, unknown> }[] = [];
  const logger: any = {
    calls,
    info: (msg: string, data?: Record<string, unknown>) => calls.push({ level: "info", msg, data }),
    debug: (msg: string, data?: Record<string, unknown>) => calls.push({ level: "debug", msg, data }),
    warn: (msg: string, data?: Record<string, unknown>) => calls.push({ level: "warn", msg, data }),
    error: (msg: string, data?: Record<string, unknown>) => calls.push({ level: "error", msg, data }),
    child: () => logger,
  };
  return logger;
}

function makeConfig(): BeastmodeConfig {
  return {
    github: { enabled: true },
    cli: { interval: 60 },
    hitl: { timeout: 30 },
    "file-permissions": { timeout: 60, "claude-settings": "" },
  };
}

function makeResolved(): ResolvedGitHub {
  return { repo: "org/repo" };
}

describe("syncFeature plan reader logging", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "feat-log-"));
  });

  test("logs warning when feature plan file does not exist", async () => {
    const logger = createSpyLogger();
    const epic: EpicSyncInput = {
      id: "bm-1",
      slug: "s",
      name: "N",
      phase: "plan",
      features: [{ id: "bm-1.1", slug: "feat-a", status: "pending", plan: "nonexistent.md" }],
    };

    await syncGitHub(epic, { "bm-1": { issue: 10 } }, makeConfig(), makeResolved(), { logger, projectRoot: tmpDir });

    const warns = logger.calls.filter(c => c.level === "warn");
    const planWarn = warns.find(c => c.msg.includes("plan") && (c.msg.includes("not found") || c.msg.includes("does not exist")));
    expect(planWarn).toBeDefined();
  });

  test("logs stored and resolved plan path at debug level", async () => {
    const planDir = join(tmpDir, ".beastmode", "artifacts", "plan");
    mkdirSync(planDir, { recursive: true });
    writeFileSync(join(planDir, "feat-plan.md"), "## User Stories\nTest\n\n## What to Build\nStuff\n");

    const logger = createSpyLogger();
    const epic: EpicSyncInput = {
      id: "bm-1",
      slug: "s",
      name: "N",
      phase: "plan",
      features: [{ id: "bm-1.1", slug: "feat-a", status: "pending", plan: "feat-plan.md" }],
    };

    await syncGitHub(epic, { "bm-1": { issue: 10 } }, makeConfig(), makeResolved(), { logger, projectRoot: tmpDir });

    const debugCalls = logger.calls.filter(c => c.level === "debug");
    const storedLog = debugCalls.find(c => c.msg.includes("stored") && c.msg.includes("plan") && c.data?.path === "feat-plan.md");
    expect(storedLog).toBeDefined();
    const resolvedLog = debugCalls.find(c => c.msg.includes("resolved") && c.msg.includes("plan") && c.data?.path?.toString().includes(tmpDir));
    expect(resolvedLog).toBeDefined();
  });
});

describe("buildArtifactsMap logging", () => {
  test("logs each phase raw path and normalized path at debug level", () => {
    const tmpDir = mkdtempSync(join(tmpdir(), "art-log-"));
    const logger = createSpyLogger();

    // Call buildArtifactsMap directly with an entity that has absolute paths
    buildArtifactsMap(
      {
        design: "/absolute/path/to/design.md",
        plan: "/absolute/path/to/plan.md",
        implement: "/absolute/path/to/impl.md",
      },
      tmpDir,
      logger,
    );

    const debugCalls = logger.calls.filter(c => c.level === "debug");

    // Verify logging for design artifact
    const designLog = debugCalls.find(c => c.msg.includes("artifact") && c.msg.includes("design"));
    expect(designLog).toBeDefined();
    expect(designLog?.data?.path).toBe("/absolute/path/to/design.md");

    // Verify logging for plan artifact
    const planLog = debugCalls.find(c => c.msg.includes("artifact") && c.msg.includes("plan"));
    expect(planLog).toBeDefined();
    expect(planLog?.data?.path).toBe("/absolute/path/to/plan.md");

    // Verify logging for implement artifact
    const implLog = debugCalls.find(c => c.msg.includes("artifact") && c.msg.includes("implement"));
    expect(implLog).toBeDefined();
    expect(implLog?.data?.path).toBe("/absolute/path/to/impl.md");
  });
});
