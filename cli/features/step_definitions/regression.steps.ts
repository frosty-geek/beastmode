/**
 * Step definitions for regression loop test.
 *
 * Adds regression-specific assertions to the pipeline test suite.
 * Reuses all existing pipeline steps from pipeline.steps.ts.
 */

import { Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { PipelineWorld } from "../support/world.js";

// -- Then: regression-specific assertions --

Then("the pipeline result should indicate regression", function (this: PipelineWorld) {
  assert.ok(this.lastResult, "No pipeline result available");
  assert.strictEqual(this.lastResult.success, true, "Pipeline run was not successful");
  assert.ok(this.lastResult.reconcileResult, "No reconcile result available");
  // Regression is indicated by the reconcile result phase going back to "implement"
  // after a validate run. The ReconcileResult doesn't have a "regressed" boolean;
  // instead, reconcileValidate sends REGRESS which transitions the machine to implement.
  assert.strictEqual(
    this.lastResult.reconcileResult.phase,
    "implement",
    `Expected reconcile phase "implement" (regression), got "${this.lastResult.reconcileResult.phase}"`,
  );
});
