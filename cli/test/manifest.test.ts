import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import {
  findManifestPath,
  readManifest,
  loadManifest,
  getPendingFeatures,
  type Manifest,
} from "../src/manifest";

const TEST_ROOT = resolve(import.meta.dir, "../.test-manifest");

function setupTestRoot(): void {
  if (existsSync(TEST_ROOT)) {
    rmSync(TEST_ROOT, { recursive: true });
  }
  mkdirSync(resolve(TEST_ROOT, ".beastmode", "state", "plan"), {
    recursive: true,
  });
}

function writeManifest(filename: string, manifest: Manifest): void {
  writeFileSync(
    resolve(TEST_ROOT, ".beastmode", "state", "plan", filename),
    JSON.stringify(manifest, null, 2),
  );
}

const sampleManifest: Manifest = {
  design: ".beastmode/state/design/2026-03-28-test-epic.md",
  architecturalDecisions: [
    { decision: "test", choice: "test-choice" },
  ],
  features: [
    { slug: "feature-a", plan: "plan-a.md", status: "pending" },
    { slug: "feature-b", plan: "plan-b.md", status: "completed" },
    { slug: "feature-c", plan: "plan-c.md", status: "in-progress" },
    { slug: "feature-d", plan: "plan-d.md", status: "blocked" },
  ],
  github: { epic: 1, repo: "test/repo" },
  lastUpdated: "2026-03-28T00:00:00Z",
};

describe("findManifestPath", () => {
  beforeEach(setupTestRoot);
  afterEach(() => rmSync(TEST_ROOT, { recursive: true, force: true }));

  test("finds manifest by design slug", () => {
    writeManifest("2026-03-28-test-epic.manifest.json", sampleManifest);
    const path = findManifestPath(TEST_ROOT, "test-epic");
    expect(path).toBeDefined();
    expect(path!.endsWith("test-epic.manifest.json")).toBe(true);
  });

  test("returns undefined when no manifest exists", () => {
    const path = findManifestPath(TEST_ROOT, "nonexistent");
    expect(path).toBeUndefined();
  });

  test("returns latest when multiple manifests exist", () => {
    writeManifest("2026-03-27-test-epic.manifest.json", sampleManifest);
    writeManifest("2026-03-28-test-epic.manifest.json", sampleManifest);
    const path = findManifestPath(TEST_ROOT, "test-epic");
    expect(path!).toContain("2026-03-28");
  });

  test("returns undefined when plan dir missing", () => {
    rmSync(TEST_ROOT, { recursive: true, force: true });
    mkdirSync(TEST_ROOT, { recursive: true });
    const path = findManifestPath(TEST_ROOT, "test-epic");
    expect(path).toBeUndefined();
  });
});

describe("readManifest", () => {
  beforeEach(setupTestRoot);
  afterEach(() => rmSync(TEST_ROOT, { recursive: true, force: true }));

  test("reads and parses valid manifest", () => {
    writeManifest("2026-03-28-test-epic.manifest.json", sampleManifest);
    const path = resolve(
      TEST_ROOT,
      ".beastmode/state/plan/2026-03-28-test-epic.manifest.json",
    );
    const manifest = readManifest(path);
    expect(manifest.features).toHaveLength(4);
    expect(manifest.github?.epic).toBe(1);
  });

  test("throws on missing file", () => {
    expect(() => readManifest("/nonexistent/path.json")).toThrow(
      "Manifest not found",
    );
  });
});

describe("loadManifest", () => {
  beforeEach(setupTestRoot);
  afterEach(() => rmSync(TEST_ROOT, { recursive: true, force: true }));

  test("loads manifest by slug", () => {
    writeManifest("2026-03-28-test-epic.manifest.json", sampleManifest);
    const manifest = loadManifest(TEST_ROOT, "test-epic");
    expect(manifest).toBeDefined();
    expect(manifest!.features).toHaveLength(4);
  });

  test("returns undefined for missing slug", () => {
    const manifest = loadManifest(TEST_ROOT, "nonexistent");
    expect(manifest).toBeUndefined();
  });
});

describe("getPendingFeatures", () => {
  test("returns pending and in-progress features", () => {
    const pending = getPendingFeatures(sampleManifest);
    expect(pending).toHaveLength(2);
    expect(pending.map((f) => f.slug)).toEqual(["feature-a", "feature-c"]);
  });

  test("returns empty array when all completed", () => {
    const allDone: Manifest = {
      ...sampleManifest,
      features: sampleManifest.features.map((f) => ({
        ...f,
        status: "completed" as const,
      })),
    };
    const pending = getPendingFeatures(allDone);
    expect(pending).toHaveLength(0);
  });
});
