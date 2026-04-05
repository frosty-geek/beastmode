/**
 * Step definitions for validate feedback loop integration test.
 *
 * Adds targeted validate failure steps and assertions.
 * Reuses pipeline steps from pipeline.steps.ts.
 */

import { When, Then, DataTable } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import * as store from "../../src/manifest/store.js";
import type { PipelineWorld } from "../support/world.js";

// -- When: validate with per-feature failures --

When(
  "the dispatch will write a validate artifact with failures:",
  function (this: PipelineWorld, table: DataTable) {
    const results = table.hashes().map((row) => ({
      feature: row.feature,
      result: row.result,
    }));
    this.pendingWriter = (cwd: string) => {
      this.writeValidateArtifactWithFailures(cwd, this.epicSlug, results);
    };
  },
);

// -- Then: reDispatchCount assertions --

Then(
  "feature {string} should have reDispatchCount {int}",
  function (this: PipelineWorld, featureSlug: string, expectedCount: number) {
    const manifest = store.load(this.projectRoot, this.epicSlug);
    assert.ok(manifest, `No manifest found for slug: ${this.epicSlug}`);
    const feature = manifest.features.find((f) => f.slug === featureSlug);
    assert.ok(feature, `Feature "${featureSlug}" not found in manifest`);
    assert.strictEqual(
      feature.reDispatchCount ?? 0,
      expectedCount,
      `Feature "${featureSlug}" has reDispatchCount ${feature.reDispatchCount ?? 0}, expected ${expectedCount}`,
    );
  },
);
