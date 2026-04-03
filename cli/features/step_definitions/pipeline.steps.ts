/**
 * Step definitions for the pipeline happy-path integration test.
 *
 * Mock boundary: only `dispatch` is mocked. Everything else runs for real --
 * git worktrees, filesystem artifacts, stop hook, manifest store, XState.
 */

import { Given, When, Then, DataTable } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import * as store from "../../src/manifest/store.js";
import type { PipelineWorld } from "../support/world.js";
import type { Phase } from "../../src/types.js";

// -- Given --

Given("the initial epic slug is {string}", function (this: PipelineWorld, slug: string) {
  this.epicSlug = slug;
});

Given("a manifest is seeded for slug {string}", async function (this: PipelineWorld, slug: string) {
  // Mirror what the CLI design command does before calling run()
  const worktreePath = resolve(this.projectRoot, ".claude", "worktrees", slug);
  store.create(this.projectRoot, slug, {
    worktree: { branch: `feature/${slug}`, path: worktreePath },
  });
});

// -- When: dispatch writers --

When("the dispatch will write a design artifact:", function (this: PipelineWorld, table: DataTable) {
  const rows = table.rowsHash() as Record<string, string>;
  this.pendingWriter = (cwd: string) => {
    this.writeDesignArtifact(cwd, rows);
  };
});

When("the dispatch will write plan artifacts:", function (this: PipelineWorld, table: DataTable) {
  const features = table.hashes().map((row) => ({
    feature: row.feature,
    wave: parseInt(row.wave, 10),
    description: row.description,
  }));
  this.pendingWriter = (cwd: string) => {
    this.writePlanArtifacts(cwd, this.epicSlug, features);
  };
});

When(
  "the dispatch will write an implement artifact for feature {string}",
  function (this: PipelineWorld, featureSlug: string) {
    this.pendingWriter = (cwd: string) => {
      this.writeImplementArtifact(cwd, this.epicSlug, featureSlug);
    };
  },
);

When(
  "the dispatch will write a validate artifact with status {string}",
  function (this: PipelineWorld, status: string) {
    this.pendingWriter = (cwd: string) => {
      this.writeValidateArtifact(cwd, this.epicSlug, status);
    };
  },
);

When(
  "the dispatch will write a release artifact with bump {string}",
  function (this: PipelineWorld, bump: string) {
    this.pendingWriter = (cwd: string) => {
      this.writeReleaseArtifact(cwd, this.epicSlug, bump);
    };
  },
);

// -- When: pipeline execution --

When("the pipeline runs the {string} phase", async function (this: PipelineWorld, phase: string) {
  await this.runPipeline(phase as Phase);
});

When(
  "the pipeline runs the {string} phase for feature {string}",
  async function (this: PipelineWorld, phase: string, featureSlug: string) {
    await this.runPipeline(phase as Phase, { featureSlug });
  },
);

// -- Then: pipeline result --

Then("the pipeline result should be successful", function (this: PipelineWorld) {
  assert.ok(this.lastResult, "No pipeline result available");
  assert.strictEqual(this.lastResult.success, true, "Pipeline run was not successful");
});

// -- Then: manifest assertions --

Then("the manifest phase should be {string}", function (this: PipelineWorld, expectedPhase: string) {
  const manifest = store.load(this.projectRoot, this.epicSlug);
  assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
  assert.strictEqual(manifest.phase, expectedPhase, `Expected phase "${expectedPhase}", got "${manifest.phase}"`);
});

Then("the manifest slug should be {string}", function (this: PipelineWorld, expectedSlug: string) {
  assert.strictEqual(this.epicSlug, expectedSlug, `Expected slug "${expectedSlug}", got "${this.epicSlug}"`);
  const manifest = store.load(this.projectRoot, expectedSlug);
  assert.ok(manifest, `No manifest found for slug: ${expectedSlug}`);
});

Then(
  "the manifest summary problem should be {string}",
  function (this: PipelineWorld, expectedProblem: string) {
    const manifest = store.load(this.projectRoot, this.epicSlug);
    assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
    assert.ok(manifest.summary, "Manifest has no summary");
    assert.strictEqual(manifest.summary.problem, expectedProblem);
  },
);

Then("the manifest should have {int} features", function (this: PipelineWorld, count: number) {
  const manifest = store.load(this.projectRoot, this.epicSlug);
  assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
  assert.strictEqual(manifest.features.length, count, `Expected ${count} features, got ${manifest.features.length}`);
});

Then("all features should have status {string}", function (this: PipelineWorld, status: string) {
  const manifest = store.load(this.projectRoot, this.epicSlug);
  assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
  for (const f of manifest.features) {
    assert.strictEqual(f.status, status, `Feature "${f.slug}" has status "${f.status}", expected "${status}"`);
  }
});

Then(
  "feature {string} should have status {string}",
  function (this: PipelineWorld, featureSlug: string, status: string) {
    const manifest = store.load(this.projectRoot, this.epicSlug);
    assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
    const feature = manifest.features.find((f) => f.slug === featureSlug);
    assert.ok(feature, `Feature "${featureSlug}" not found in manifest`);
    assert.strictEqual(feature.status, status, `Feature "${featureSlug}" has status "${feature.status}", expected "${status}"`);
  },
);

Then("the worktree should be cleaned up", function (this: PipelineWorld) {
  const worktreeDir = resolve(this.projectRoot, ".claude", "worktrees", this.epicSlug);
  assert.strictEqual(existsSync(worktreeDir), false, `Worktree directory still exists: ${worktreeDir}`);
});
