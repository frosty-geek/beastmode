/**
 * Step definitions for version-consolidation integration tests.
 *
 * Tests verify structural properties of the CLI source code
 * for the version consolidation feature.
 * Source analysis only — no runtime execution.
 */

import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const CLI_SRC = resolve(import.meta.dirname, "../../src");

interface VersionConsolidationWorld {
  sources: Map<string, string>;
  currentSource: string;
}

Given("the CLI source tree is loaded", function (this: VersionConsolidationWorld) {
  this.sources = new Map();
  const files = [
    "version.ts",
    "index.ts",
    "commands/watch-loop.ts",
  ];
  for (const file of files) {
    const fullPath = resolve(CLI_SRC, file);
    if (existsSync(fullPath)) {
      this.sources.set(file, readFileSync(fullPath, "utf-8"));
    }
  }
});

When("I examine the version module at {string}", function (this: VersionConsolidationWorld, path: string) {
  const source = this.sources.get(path);
  assert.ok(source, `Source file "${path}" should exist`);
  this.currentSource = source;
});

When("I examine the CLI entry point at {string}", function (this: VersionConsolidationWorld, path: string) {
  const source = this.sources.get(path);
  assert.ok(source, `Source file "${path}" should exist`);
  this.currentSource = source;
});

When("I examine the watch loop at {string}", function (this: VersionConsolidationWorld, path: string) {
  const source = this.sources.get(path);
  assert.ok(source, `Source file "${path}" should exist`);
  this.currentSource = source;
});

Then("the module exports a {string} function", function (this: VersionConsolidationWorld, funcName: string) {
  assert.ok(
    this.currentSource.includes(`export function ${funcName}`) ||
    this.currentSource.includes(`export { ${funcName}`) ||
    this.currentSource.includes(`export const ${funcName}`),
    `Module should export "${funcName}"`
  );
});

Then("the module references {string} in its file read", function (this: VersionConsolidationWorld, filename: string) {
  assert.ok(
    this.currentSource.includes(filename),
    `Module should reference "${filename}"`
  );
});

Then("the module uses {string} for path traversal", function (this: VersionConsolidationWorld, api: string) {
  assert.ok(
    this.currentSource.includes(api),
    `Module should use "${api}"`
  );
});

Then("it imports from the version module", function (this: VersionConsolidationWorld) {
  assert.ok(
    this.currentSource.includes('from "./version') ||
    this.currentSource.includes('from "../version'),
    "Should import from the version module"
  );
});

Then("it does not contain a hardcoded VERSION constant", function (this: VersionConsolidationWorld) {
  const hardcoded = this.currentSource.match(/const VERSION\s*=\s*["']\d+\.\d+\.\d+["']/);
  assert.ok(!hardcoded, "Should not contain a hardcoded VERSION constant");
});

Then("it does not contain a local resolveVersion function", function (this: VersionConsolidationWorld) {
  const localFunc = this.currentSource.match(/^function resolveVersion/m);
  assert.ok(!localFunc, "Should not contain a local resolveVersion function definition");
});

Then("the return format matches {string} pattern", function (this: VersionConsolidationWorld, _pattern: string) {
  assert.ok(
    this.currentSource.includes("`v${") || this.currentSource.includes('"v" +') || this.currentSource.includes("'v' +"),
    "Return format should prefix with 'v'"
  );
});

Then("the module does not reference {string} or {string}", function (this: VersionConsolidationWorld, ref1: string, ref2: string) {
  assert.ok(!this.currentSource.includes(ref1), `Module should not reference "${ref1}"`);
  assert.ok(!this.currentSource.includes(ref2), `Module should not reference "${ref2}"`);
});
