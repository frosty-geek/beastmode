import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const PHASE_TS_PATH = resolve(import.meta.dirname, "../commands/phase.ts");
const RECONCILE_TS_PATH = resolve(import.meta.dirname, "../pipeline/reconcile.ts");
const RUNNER_TS_PATH = resolve(import.meta.dirname, "../pipeline/runner.ts");

describe("phase.ts slug deduplication", () => {
  test("no slugify function defined in phase.ts", () => {
    const source = readFileSync(PHASE_TS_PATH, "utf-8");
    expect(source).not.toMatch(/export function slugify/);
    expect(source).not.toMatch(/function slugify/);
  });

  test("no randomHex function defined in phase.ts", () => {
    const source = readFileSync(PHASE_TS_PATH, "utf-8");
    expect(source).not.toMatch(/export function randomHex/);
    expect(source).not.toMatch(/function randomHex/);
  });

  test("no slug imports in reconcile.ts", () => {
    const source = readFileSync(RECONCILE_TS_PATH, "utf-8");
    expect(source).not.toMatch(/import.*slugify/);
    expect(source).not.toMatch(/import.*deriveEpicSlug/);
    expect(source).not.toMatch(/import.*from.*slug/);
  });

  test("design branch uses store.addPlaceholderEpic()", () => {
    const source = readFileSync(PHASE_TS_PATH, "utf-8");
    expect(source).toContain("addPlaceholderEpic()");
    expect(source).not.toContain("generatePlaceholderName");
  });

  test("non-design phases still use args directly", () => {
    const source = readFileSync(PHASE_TS_PATH, "utf-8");
    expect(source).toContain('args[0] || "default"');
  });

  test("no placeholder imports outside store", () => {
    const phaseSource = readFileSync(PHASE_TS_PATH, "utf-8");
    const runnerSource = readFileSync(RUNNER_TS_PATH, "utf-8");
    expect(phaseSource).not.toMatch(/import.*from.*placeholder/);
    expect(runnerSource).not.toMatch(/import.*from.*placeholder/);
  });
});
