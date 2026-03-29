import { describe, it, expect } from "bun:test";
import { createSessionStrategy } from "../src/session-factory.js";
import { SdkStrategy } from "../src/sdk-strategy.js";

describe("SessionFactory", () => {
  it("returns SdkStrategy for 'sdk' config", async () => {
    const strategy = await createSessionStrategy({ strategy: "sdk" });
    expect(strategy).toBeInstanceOf(SdkStrategy);
  });

  it("throws when cmux config but cmux unavailable", async () => {
    await expect(
      createSessionStrategy({
        strategy: "cmux",
        isCmuxAvailable: async () => false,
      }),
    ).rejects.toThrow("cmux is not available");
  });

  it("returns SdkStrategy for 'auto' when cmux unavailable", async () => {
    const strategy = await createSessionStrategy({
      strategy: "auto",
      isCmuxAvailable: async () => false,
    });
    expect(strategy).toBeInstanceOf(SdkStrategy);
  });

  it("returns SdkStrategy for 'auto' when cmux available (placeholder)", async () => {
    // Until CmuxStrategy is implemented, auto falls back to SDK
    const strategy = await createSessionStrategy({
      strategy: "auto",
      isCmuxAvailable: async () => true,
    });
    expect(strategy).toBeInstanceOf(SdkStrategy);
  });

  it("defaults to SdkStrategy for unknown strategy value", async () => {
    const strategy = await createSessionStrategy({
      strategy: "sdk",
    });
    expect(strategy).toBeInstanceOf(SdkStrategy);
  });
});
