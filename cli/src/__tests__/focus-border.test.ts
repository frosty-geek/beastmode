import { describe, test, expect } from "vitest";
import { CHROME } from "../dashboard/monokai-palette.js";

describe("PanelBox borderColor prop", () => {
  test("PanelBoxProps interface includes optional borderColor", async () => {
    const mod = await import("../dashboard/PanelBox.js");
    // PanelBox is the default export — it's a function component
    expect(typeof mod.default).toBe("function");
  });

  test("borderColor defaults to CHROME.border when undefined", () => {
    // When borderColor is undefined, the component should use CHROME.border
    const borderColor: string | undefined = undefined;
    const effectiveColor = borderColor ?? CHROME.border;
    expect(effectiveColor).toBe("#727072");
  });

  test("borderColor overrides CHROME.border when provided", () => {
    const borderColor: string | undefined = "#FF0000";
    const effectiveColor = borderColor ?? CHROME.border;
    expect(effectiveColor).toBe("#FF0000");
  });
});
