/**
 * Cucumber lifecycle hooks for watch-loop integration tests.
 */

import { Before, After } from "@cucumber/cucumber";
import type { WatchLoopWorld } from "./watch-world.js";

Before(async function (this: WatchLoopWorld) {
  this.setup();
});

After(async function (this: WatchLoopWorld) {
  this.teardown();
});
