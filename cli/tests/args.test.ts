import { describe, expect, test } from "bun:test";
import { parseArgs } from "../src/args";
import { slugify } from "../src/commands/phase";

describe("parseArgs", () => {
  test("parses design phase with topic", () => {
    const result = parseArgs(["bun", "index.ts", "design", "my", "cool", "topic"]);
    expect(result.command).toBe("design");
    expect(result.args).toEqual(["my", "cool", "topic"]);
  });

  test("parses plan phase with slug", () => {
    const result = parseArgs(["bun", "index.ts", "plan", "my-design"]);
    expect(result.command).toBe("plan");
    expect(result.args).toEqual(["my-design"]);
  });

  test("parses implement phase with slug and feature", () => {
    const result = parseArgs(["bun", "index.ts", "implement", "my-design", "my-feature"]);
    expect(result.command).toBe("implement");
    expect(result.args).toEqual(["my-design", "my-feature"]);
  });

  test("parses validate phase with slug", () => {
    const result = parseArgs(["bun", "index.ts", "validate", "my-design"]);
    expect(result.command).toBe("validate");
    expect(result.args).toEqual(["my-design"]);
  });

  test("parses release phase with slug", () => {
    const result = parseArgs(["bun", "index.ts", "release", "my-design"]);
    expect(result.command).toBe("release");
    expect(result.args).toEqual(["my-design"]);
  });

  test("parses watch command", () => {
    const result = parseArgs(["bun", "index.ts", "watch"]);
    expect(result.command).toBe("watch");
    expect(result.args).toEqual([]);
  });

  test("parses status command", () => {
    const result = parseArgs(["bun", "index.ts", "status"]);
    expect(result.command).toBe("status");
    expect(result.args).toEqual([]);
  });

  test("returns help when no args", () => {
    const result = parseArgs(["bun", "index.ts"]);
    expect(result.command).toBe("help");
    expect(result.args).toEqual([]);
  });

  test("parses help command explicitly", () => {
    const result = parseArgs(["bun", "index.ts", "help"]);
    expect(result.command).toBe("help");
    expect(result.args).toEqual([]);
  });

  test("rejects unknown commands", () => {
    const mockExit = (() => { throw new Error("process.exit"); }) as never;
    const origExit = process.exit;
    process.exit = mockExit;
    try {
      expect(() => parseArgs(["bun", "index.ts", "run", "plan", "foo"])).toThrow("process.exit");
    } finally {
      process.exit = origExit;
    }
  });
});

describe("slugify", () => {
  test("lowercases and converts spaces to hyphens", () => {
    expect(slugify("My Cool Topic")).toBe("my-cool-topic");
  });

  test("strips non-alphanumeric characters", () => {
    expect(slugify("TypeScript's Pipeline!")).toBe("typescripts-pipeline");
  });

  test("collapses multiple hyphens", () => {
    expect(slugify("foo  --  bar")).toBe("foo-bar");
  });

  test("strips leading and trailing hyphens", () => {
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  test("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});
