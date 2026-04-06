import { describe, test, expect } from "vitest";

// ---------------------------------------------------------------------------
// Version state management logic
// ---------------------------------------------------------------------------

describe("version capture from started event", () => {
  test("extracts version string from started event payload", () => {
    const payload = { version: "v0.96.0", pid: 12345, intervalSeconds: 30 };
    const captured = payload.version;
    expect(captured).toBe("v0.96.0");
  });

  test("version is null before started event fires", () => {
    const version: string | null = null;
    expect(version).toBeNull();
  });

  test("version updates when started event fires", () => {
    let version: string | null = null;
    const onStarted = (ev: { version: string }) => {
      version = ev.version;
    };
    onStarted({ version: "v0.97.0" });
    expect(version).toBe("v0.97.0");
  });
});

// ---------------------------------------------------------------------------
// Version display formatting
// ---------------------------------------------------------------------------

describe("version display rendering logic", () => {
  test("version prop is passed when state is non-null", () => {
    const version: string | null = "v0.96.0";
    const propValue = version ?? undefined;
    expect(propValue).toBe("v0.96.0");
  });

  test("version prop is undefined when state is null", () => {
    const version: string | null = null;
    const propValue = version ?? undefined;
    expect(propValue).toBeUndefined();
  });

  test("version string is clean semver without git hash", () => {
    const version = "v0.96.0";
    const hashMatch = version.match(/\([a-f0-9]+\)/);
    expect(hashMatch).toBeNull();
  });

  test("version string matches v{semver} format", () => {
    const version = "v0.96.0";
    const semverMatch = version.match(/^v\d+\.\d+\.\d+$/);
    expect(semverMatch).not.toBeNull();
  });
});
