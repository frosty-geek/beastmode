import { describe, it, expect } from "vitest";
import { generatePlaceholderName } from "./placeholder.js";

describe("generatePlaceholderName", () => {
  it("returns a string matching adjective-noun pattern", () => {
    const name = generatePlaceholderName("a1b2");
    expect(name).toMatch(/^[a-z]+-[a-z]+$/);
  });

  it("produces deterministic output for the same hex input", () => {
    const a = generatePlaceholderName("abcd");
    const b = generatePlaceholderName("abcd");
    expect(a).toBe(b);
  });

  it("produces different names for different hex inputs", () => {
    const a = generatePlaceholderName("0001");
    const b = generatePlaceholderName("0002");
    expect(a).not.toBe(b);
  });

  it("contains human-readable words, not bare hex", () => {
    const name = generatePlaceholderName("beef");
    expect(/[a-z]{3,}/.test(name)).toBe(true);
    expect(/^[0-9a-f]+$/.test(name)).toBe(false);
  });

  it("does not embed the hex suffix in the output", () => {
    const name = generatePlaceholderName("f3a7");
    expect(name).not.toContain("f3a7");
  });
});
