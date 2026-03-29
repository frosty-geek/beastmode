import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { updateConfig, detectRepo, loadConfig } from "../src/config";

describe("updateConfig", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "beastmode-config-test-"));
    mkdirSync(join(tmpDir, ".beastmode"), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("adds a new field to existing section", () => {
    writeFileSync(
      join(tmpDir, ".beastmode", "config.yaml"),
      `github:\n  enabled: true\n`
    );
    updateConfig(tmpDir, { github: { repo: "owner/repo" } });
    const result = readFileSync(join(tmpDir, ".beastmode", "config.yaml"), "utf-8");
    expect(result).toContain("repo: owner/repo");
    expect(result).toContain("enabled: true");
  });

  test("updates an existing field value", () => {
    writeFileSync(
      join(tmpDir, ".beastmode", "config.yaml"),
      `github:\n  enabled: false\n  repo: old/repo\n`
    );
    updateConfig(tmpDir, { github: { repo: "new/repo" } });
    const result = readFileSync(join(tmpDir, ".beastmode", "config.yaml"), "utf-8");
    expect(result).toContain("repo: new/repo");
    expect(result).not.toContain("old/repo");
  });

  test("preserves comments", () => {
    writeFileSync(
      join(tmpDir, ".beastmode", "config.yaml"),
      `# Main config\ngithub:\n  enabled: true                     # Set by setup\n  project-name: "Beastmode Pipeline" # Board name\n`
    );
    updateConfig(tmpDir, { github: { repo: "owner/repo" } });
    const result = readFileSync(join(tmpDir, ".beastmode", "config.yaml"), "utf-8");
    expect(result).toContain("# Main config");
    expect(result).toContain("# Set by setup");
    expect(result).toContain("repo: owner/repo");
  });

  test("adds new section if missing", () => {
    writeFileSync(
      join(tmpDir, ".beastmode", "config.yaml"),
      `gates:\n  design:\n    prd-approval: human\n`
    );
    updateConfig(tmpDir, { github: { enabled: true } });
    const result = readFileSync(join(tmpDir, ".beastmode", "config.yaml"), "utf-8");
    expect(result).toContain("github:");
    expect(result).toContain("enabled: true");
  });

  test("writes map values (field-options)", () => {
    writeFileSync(
      join(tmpDir, ".beastmode", "config.yaml"),
      `github:\n  enabled: true\n`
    );
    updateConfig(tmpDir, {
      github: {
        "field-options": {
          Backlog: "1512ab63",
          Design: "ad192401",
          Done: "14844120",
        } as unknown as string,
      },
    });
    const result = readFileSync(join(tmpDir, ".beastmode", "config.yaml"), "utf-8");
    expect(result).toContain("field-options:");
    expect(result).toContain("Backlog: 1512ab63");
    expect(result).toContain("Design: ad192401");
    expect(result).toContain("Done: 14844120");
  });

  test("written config can be loaded back correctly", () => {
    writeFileSync(
      join(tmpDir, ".beastmode", "config.yaml"),
      `github:\n  enabled: true\n`
    );
    updateConfig(tmpDir, {
      github: {
        repo: "owner/repo",
        "project-id": "PVT_abc123",
        "project-number": 2 as unknown as string,
        "field-id": "PVTSSF_xyz",
        "field-options": {
          Design: "opt1",
          Plan: "opt2",
          Done: "opt3",
        } as unknown as string,
      },
    });
    const config = loadConfig(tmpDir);
    expect(config.github.repo).toBe("owner/repo");
    expect(config.github["project-id"]).toBe("PVT_abc123");
    expect(config.github["project-number"]).toBe(2);
    expect(config.github["field-id"]).toBe("PVTSSF_xyz");
    expect(config.github["field-options"]).toEqual({
      Design: "opt1",
      Plan: "opt2",
      Done: "opt3",
    });
  });
});

describe("detectRepo", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "beastmode-detect-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("returns undefined for non-git directory", () => {
    expect(detectRepo(tmpDir)).toBeUndefined();
  });

  test("parses HTTPS remote URL", () => {
    const { execSync } = require("child_process");
    execSync("git init", { cwd: tmpDir });
    execSync("git remote add origin https://github.com/test-owner/test-repo.git", { cwd: tmpDir });
    expect(detectRepo(tmpDir)).toBe("test-owner/test-repo");
  });

  test("parses HTTPS remote URL without .git suffix", () => {
    const { execSync } = require("child_process");
    execSync("git init", { cwd: tmpDir });
    execSync("git remote add origin https://github.com/test-owner/test-repo", { cwd: tmpDir });
    expect(detectRepo(tmpDir)).toBe("test-owner/test-repo");
  });

  test("parses SSH remote URL", () => {
    const { execSync } = require("child_process");
    execSync("git init", { cwd: tmpDir });
    execSync("git remote add origin git@github.com:test-owner/test-repo.git", { cwd: tmpDir });
    expect(detectRepo(tmpDir)).toBe("test-owner/test-repo");
  });

  test("returns undefined for non-GitHub remote", () => {
    const { execSync } = require("child_process");
    execSync("git init", { cwd: tmpDir });
    execSync("git remote add origin https://gitlab.com/test-owner/test-repo.git", { cwd: tmpDir });
    expect(detectRepo(tmpDir)).toBeUndefined();
  });
});
