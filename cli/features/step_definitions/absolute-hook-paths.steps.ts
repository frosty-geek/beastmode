/**
 * Step definitions for absolute hook path resolution integration test.
 *
 * Exercises the real hook builder functions — no mocks.
 * Verifies paths are absolute, point to real files, and contain no shell substitution.
 */

import { Given, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { readFileSync, mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { buildPreToolUseHook, writeHitlSettings } from "../../src/hooks/hitl-settings.js";
import { buildFilePermissionPostToolUseHooks } from "../../src/hooks/file-permission-settings.js";

// World state shared across steps within a scenario
interface HookPathWorld {
  preToolUseCommand?: string;
  filePermPostCommands?: string[];
  stopCommand?: string;
  allCapturedPaths: string[];
}

/** Extract the quoted path from a bun run command like: bun run "/abs/path/script.ts" phase */
function extractPath(command: string): string {
  const match = command.match(/"([^"]+)"/);
  assert.ok(match, `No quoted path found in command: ${command}`);
  return match[1];
}

// --- Given ---

Given("a PreToolUse hook is built for phase {string}", function (this: HookPathWorld, phase: string) {
  if (!this.allCapturedPaths) this.allCapturedPaths = [];
  const entry = buildPreToolUseHook(phase);
  this.preToolUseCommand = entry.hooks[0].command;
  this.allCapturedPaths.push(extractPath(this.preToolUseCommand));
});

Given("file-permission PostToolUse hooks are built for phase {string}", function (this: HookPathWorld, phase: string) {
  if (!this.allCapturedPaths) this.allCapturedPaths = [];
  const hooks = buildFilePermissionPostToolUseHooks(phase);
  this.filePermPostCommands = hooks.map((h) => h.hooks[0].command as string);
  for (const cmd of this.filePermPostCommands) {
    this.allCapturedPaths.push(extractPath(cmd));
  }
});

Given("HITL settings are written for phase {string}", function (this: HookPathWorld, phase: string) {
  if (!this.allCapturedPaths) this.allCapturedPaths = [];
  // Write to a temp dir and read back to extract Stop hook command
  const tempDir = mkdtempSync(join(tmpdir(), "hook-path-bdd-"));
  const claudeDir = join(tempDir, ".claude");
  mkdirSync(claudeDir, { recursive: true });

  const preToolUseHook = buildPreToolUseHook(phase);
  writeHitlSettings({ claudeDir, preToolUseHook, phase });

  const settings = JSON.parse(readFileSync(join(claudeDir, "settings.local.json"), "utf-8"));
  const stopCmd = settings.hooks?.Stop?.[0]?.hooks?.[0]?.command;
  assert.ok(stopCmd, "No Stop hook command found in written settings");
  this.stopCommand = stopCmd;
  this.allCapturedPaths.push(extractPath(stopCmd));
});

// --- Then ---

Then("the hook command should contain an absolute path to {string}", function (this: HookPathWorld, script: string) {
  const cmd = this.preToolUseCommand;
  assert.ok(cmd, "No PreToolUse hook command captured");
  const path = extractPath(cmd);
  assert.ok(isAbsolute(path), `Path is not absolute: ${path}`);
  assert.ok(path.endsWith(script), `Path does not end with ${script}: ${path}`);
});

Then("the hook command should not contain {string}", function (this: HookPathWorld, pattern: string) {
  const cmd = this.preToolUseCommand;
  assert.ok(cmd, "No PreToolUse hook command captured");
  assert.ok(!cmd.includes(pattern), `Command contains "${pattern}": ${cmd}`);
});

Then("all hook commands should contain an absolute path to {string}", function (this: HookPathWorld, script: string) {
  const commands = this.filePermPostCommands;
  assert.ok(commands && commands.length > 0, "No file-permission hook commands captured");
  for (const cmd of commands) {
    const path = extractPath(cmd);
    assert.ok(isAbsolute(path), `Path is not absolute: ${path}`);
    assert.ok(path.endsWith(script), `Path does not end with ${script}: ${path}`);
  }
});

Then("no hook command should contain {string}", function (this: HookPathWorld, pattern: string) {
  const commands = this.filePermPostCommands;
  assert.ok(commands && commands.length > 0, "No file-permission hook commands captured");
  for (const cmd of commands) {
    assert.ok(!cmd.includes(pattern), `Command contains "${pattern}": ${cmd}`);
  }
});

Then("the Stop hook command should contain an absolute path to {string}", function (this: HookPathWorld, script: string) {
  assert.ok(this.stopCommand, "No Stop hook command captured");
  const path = extractPath(this.stopCommand);
  assert.ok(isAbsolute(path), `Path is not absolute: ${path}`);
  assert.ok(path.endsWith(script), `Path does not end with ${script}: ${path}`);
});

Then("the Stop hook command should not contain {string}", function (this: HookPathWorld, pattern: string) {
  assert.ok(this.stopCommand, "No Stop hook command captured");
  assert.ok(!this.stopCommand.includes(pattern), `Stop command contains "${pattern}": ${this.stopCommand}`);
});

Then("all captured hook command paths should reference files that exist on disk", function (this: HookPathWorld) {
  assert.ok(this.allCapturedPaths.length > 0, "No hook paths captured");
  for (const path of this.allCapturedPaths) {
    assert.ok(existsSync(path), `Script file does not exist: ${path}`);
  }
});
