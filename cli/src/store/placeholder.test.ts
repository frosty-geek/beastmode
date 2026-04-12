import { describe, it, expect } from "vitest";
import { generatePlaceholderName, stripPlaceholderHex, ADJECTIVES, NOUNS } from "./placeholder.js";

describe("generatePlaceholderName", () => {
  it("returns a string matching adjective-noun-hex pattern", () => {
    const name = generatePlaceholderName("a1b2");
    expect(name).toMatch(/^[a-z]+-[a-z]+-[0-9a-f]{4}$/);
  });

  it("embeds the provided hex suffix", () => {
    const name = generatePlaceholderName("f3a7");
    expect(name).toMatch(/-f3a7$/);
  });

  it("uses a word from the adjective list", () => {
    const name = generatePlaceholderName("1234");
    const adj = name.split("-")[0];
    expect(ADJECTIVES).toContain(adj);
  });

  it("uses a word from the noun list", () => {
    const name = generatePlaceholderName("1234");
    const noun = name.split("-")[1];
    expect(NOUNS).toContain(noun);
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
});

describe("stripPlaceholderHex", () => {
  it("strips trailing 4-hex suffix from placeholder names", () => {
    expect(stripPlaceholderHex("quick-quartz-f284")).toBe("quick-quartz");
  });

  it("returns non-placeholder strings unchanged", () => {
    expect(stripPlaceholderHex("my-custom-slug")).toBe("my-custom-slug");
  });

  it("only strips exactly 4-char hex at end", () => {
    expect(stripPlaceholderHex("foo-abcde")).toBe("foo-abcde"); // 5 chars, no strip
    expect(stripPlaceholderHex("foo-abc")).toBe("foo-abc"); // 3 chars, no strip
  });

  it("roundtrips with generatePlaceholderName", () => {
    const name = generatePlaceholderName("beef");
    const stripped = stripPlaceholderHex(name);
    expect(stripped).not.toContain("beef");
    expect(name).toBe(`${stripped}-beef`);
  });
});

describe("word lists", () => {
  it("has at least 50 adjectives", () => {
    expect(ADJECTIVES.length).toBeGreaterThanOrEqual(50);
  });

  it("has at least 50 nouns", () => {
    expect(NOUNS.length).toBeGreaterThanOrEqual(50);
  });

  it("all adjectives are lowercase alpha only", () => {
    for (const adj of ADJECTIVES) {
      expect(adj).toMatch(/^[a-z]+$/);
    }
  });

  it("all nouns are lowercase alpha only", () => {
    for (const noun of NOUNS) {
      expect(noun).toMatch(/^[a-z]+$/);
    }
  });
});
