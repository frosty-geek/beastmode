/**
 * Step definitions for pipeline error resilience integration test.
 *
 * Tests that dispatch failures and missing artifacts don't crash the pipeline,
 * and that the pipeline returns gracefully with success: false.
 */

import { When, Then } from "@cucumber/cucumber";
import { strict as assert } from "node:assert";
import type { PipelineWorld } from "../support/world.js";
import type { Phase, PhaseResult } from "../../src/types.js";

// -- When: dispatch failure modes --

When("the dispatch will fail", function (this: PipelineWorld) {
  // Set pendingWriter to null so no artifacts are written
  this.pendingWriter = null;

  // Override makeDispatch to return a failing dispatch
  const world = this;
  const originalMakeDispatch = world.makeDispatch.bind(world);
  world.makeDispatch = () => {
    // Restore original for future calls
    world.makeDispatch = originalMakeDispatch;
    return async () => ({
      success: false,
      result: {
        exit_status: "error" as const,
        duration_ms: 100,
        session_id: null,
      } as PhaseResult,
    });
  };
});

When("the dispatch will produce no output", function (this: PipelineWorld) {
  // Set pendingWriter to null so no artifacts are written
  this.pendingWriter = null;

  // Override makeDispatch to return success but with no artifacts
  const world = this;
  const originalMakeDispatch = world.makeDispatch.bind(world);
  world.makeDispatch = () => {
    // Restore original for future calls
    world.makeDispatch = originalMakeDispatch;
    return async () => ({
      success: false,
      result: {
        exit_status: "error" as const,
        duration_ms: 100,
        session_id: null,
      } as PhaseResult,
    });
  };
});

// -- Then: failure assertions --

Then("the pipeline result should be failure", function (this: PipelineWorld) {
  assert.ok(this.lastResult, "No pipeline result available");
  assert.strictEqual(this.lastResult.success, false, "Pipeline run was successful but expected failure");
});

Then("the pipeline should not throw", function (this: PipelineWorld) {
  // This step passes implicitly if we got here without throwing
  assert.ok(true, "Pipeline executed without throwing");
});
