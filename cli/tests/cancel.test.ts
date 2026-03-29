import { describe, test, expect } from "bun:test";
import { parseArgs } from "../src/args";

describe("cancel command parsing", () => {
  test("parses cancel command with slug", () => {
    const result = parseArgs(["bun", "index.ts", "cancel", "my-epic"]);
    expect(result.command).toBe("cancel");
    expect(result.args).toEqual(["my-epic"]);
  });

  test("parses cancel command without slug", () => {
    const result = parseArgs(["bun", "index.ts", "cancel"]);
    expect(result.command).toBe("cancel");
    expect(result.args).toEqual([]);
  });
});
