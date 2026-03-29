/**
 * Session factory — selects the appropriate SessionStrategy
 * based on config and runtime availability.
 */

import type { DispatchStrategy } from "./config.js";
import type { SessionStrategy } from "./session-strategy.js";
import { SdkStrategy } from "./sdk-strategy.js";

export interface SessionFactoryOptions {
  strategy: DispatchStrategy;
  /** Runtime check: is cmux available? */
  isCmuxAvailable?: () => Promise<boolean>;
}

/**
 * Create the appropriate session strategy based on config.
 *
 * - "sdk": Always returns SdkStrategy
 * - "cmux": Returns CmuxStrategy if available, throws if not
 * - "auto": Returns CmuxStrategy if available, SdkStrategy fallback
 */
export async function createSessionStrategy(
  options: SessionFactoryOptions,
): Promise<SessionStrategy> {
  const { strategy, isCmuxAvailable } = options;

  switch (strategy) {
    case "sdk":
      return new SdkStrategy();

    case "cmux": {
      const available = isCmuxAvailable ? await isCmuxAvailable() : false;
      if (!available) {
        throw new Error(
          "dispatch-strategy is 'cmux' but cmux is not available. " +
          "Install cmux or set dispatch-strategy to 'sdk' or 'auto'.",
        );
      }
      // CmuxStrategy will be implemented in a later feature
      throw new Error("CmuxStrategy not yet implemented");
    }

    case "auto": {
      const available = isCmuxAvailable ? await isCmuxAvailable() : false;
      if (available) {
        // CmuxStrategy will be implemented in a later feature
        // For now, fall back to SDK
        console.log("[watch] cmux available but CmuxStrategy not yet implemented — using SDK");
      }
      return new SdkStrategy();
    }

    default:
      return new SdkStrategy();
  }
}
