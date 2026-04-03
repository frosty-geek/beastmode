/**
 * Cucumber lifecycle hooks for pipeline integration tests.
 */

import { Before, After } from "@cucumber/cucumber";
import type { PipelineWorld } from "./world.js";

Before(async function (this: PipelineWorld) {
  await this.setup();
});

After(async function (this: PipelineWorld) {
  await this.teardown();
});
