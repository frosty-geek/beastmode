import { describe, it, expect } from "bun:test";
import { slugify, isValidSlug, deduplicateSlug } from "./slug.js";

describe("slugify", () => {
  it("should lowercase and hyphenate", () => {
    expect(slugify("Login Flow")).toBe("login-flow");
  });

  it("should strip special characters", () => {
    expect(slugify("Login Flow!")).toBe("login-flow");
  });

  it("should collapse multiple hyphens", () => {
    expect(slugify("a--b---c")).toBe("a-b-c");
  });

  it("should strip leading and trailing hyphens", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("should throw on empty input", () => {
    expect(() => slugify("")).toThrow("Cannot slugify");
  });

  it("should throw on all-special-character input", () => {
    expect(() => slugify("!!!")).toThrow("Cannot slugify");
  });

  it("should preserve already-valid slugs", () => {
    expect(slugify("auth-system")).toBe("auth-system");
  });
});

describe("isValidSlug", () => {
  it("should accept valid slugs", () => {
    expect(isValidSlug("auth-system")).toBe(true);
    expect(isValidSlug("a")).toBe(true);
    expect(isValidSlug("abc123")).toBe(true);
  });

  it("should reject leading hyphens", () => {
    expect(isValidSlug("-auth")).toBe(false);
  });

  it("should reject trailing hyphens", () => {
    expect(isValidSlug("auth-")).toBe(false);
  });

  it("should reject uppercase", () => {
    expect(isValidSlug("Auth")).toBe(false);
  });

  it("should reject special characters", () => {
    expect(isValidSlug("auth!system")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });
});

describe("deduplicateSlug", () => {
  it("should return slug unchanged when no collision", () => {
    const existing = new Set<string>();
    expect(deduplicateSlug("login-flow", "bm-a1b2.1", existing)).toBe("login-flow");
  });

  it("should append suffix on collision", () => {
    const existing = new Set(["login-flow"]);
    const result = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    expect(result).not.toBe("login-flow");
    expect(result.startsWith("login-flow-")).toBe(true);
    expect(isValidSlug(result)).toBe(true);
  });

  it("should produce deterministic suffix from entity ID", () => {
    const existing = new Set(["login-flow"]);
    const result1 = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    const result2 = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    expect(result1).toBe(result2);
  });

  it("should produce different suffixes for different IDs", () => {
    const existing = new Set(["login-flow"]);
    const result1 = deduplicateSlug("login-flow", "bm-a1b2.1", existing);
    const result2 = deduplicateSlug("login-flow", "bm-c3d4.2", existing);
    expect(result1).not.toBe(result2);
  });
});
