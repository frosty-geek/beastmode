/**
 * Cucumber lifecycle hooks for cancel-flow integration tests.
 */

import { Before, After } from "@cucumber/cucumber";
import type { CancelWorld } from "./cancel-world.js";

Before(async function (this: CancelWorld) {
  await this.setup();
});

After(async function (this: CancelWorld) {
  await this.teardown();
});
