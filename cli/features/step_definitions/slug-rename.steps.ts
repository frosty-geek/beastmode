/**
 * Step definitions for design slug rename test.
 *
 * Verifies that the design phase successfully renames hex slugs to readable
 * epic names, and that worktrees and git branches follow the rename.
 * Reuses all existing pipeline steps from pipeline.steps.ts.
 */

import { Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { git } from "../../src/git/worktree.js";
import type { PipelineWorld } from "../support/world.js";

// -- Then: slug rename verification --

Then("the worktree should exist for slug {string}", function (this: PipelineWorld, slug: string) {
  const worktreeDir = resolve(this.projectRoot, ".claude", "worktrees", slug);
  assert.strictEqual(
    existsSync(worktreeDir),
    true,
    `Worktree directory does not exist for slug "${slug}": ${worktreeDir}`,
  );
});

Then(
  "the git branch {string} should exist",
  async function (this: PipelineWorld, branchName: string) {
    const result = await git(["branch", "--list", branchName], { cwd: this.projectRoot });
    const output = result.toString().trim();
    assert.ok(output.length > 0, `Git branch "${branchName}" does not exist in repository`);
  },
);

Then(
  "the manifest for slug {string} should not exist",
  function (this: PipelineWorld, slug: string) {
    const manifestPath = resolve(this.projectRoot, ".beastmode", "state", `${slug}.json`);
    assert.strictEqual(
      existsSync(manifestPath),
      false,
      `Manifest file should not exist for old slug "${slug}": ${manifestPath}`,
    );
  },
);
