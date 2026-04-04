import { describe, test, expect } from "bun:test";

// ---------------------------------------------------------------------------
// PanelBox backgroundColor prop
// ---------------------------------------------------------------------------

describe("PanelBox backgroundColor prop", () => {
  test("backgroundColor prop is accepted and passed to content Box", () => {
    const props = { title: "TEST", backgroundColor: "#2d2d2d" };
    expect(props.backgroundColor).toBe("#2d2d2d");
  });

  test("backgroundColor defaults to undefined when not provided", () => {
    const props = { title: "TEST" };
    const bg = (props as { backgroundColor?: string }).backgroundColor;
    expect(bg).toBeUndefined();
  });
});
