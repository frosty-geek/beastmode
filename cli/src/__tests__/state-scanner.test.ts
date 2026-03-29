import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { resolve } from "path";
import { scanEpics, slugFromDesign, resolveConflicts } from "../state-scanner";

const TEST_ROOT = resolve(import.meta.dir, "../../.test-state-scanner");
const TEST_DATE = "2026-03-29";

function setupTestRoot(): void {
  if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true });
  mkdirSync(resolve(TEST_ROOT, ".beastmode", "state", "design"), { recursive: true });
  mkdirSync(resolve(TEST_ROOT, ".beastmode", "state", "plan"), { recursive: true });
  // Config not needed — scanner no longer reads config for gate checking
}

function writeDesign(slug: string): void {
  writeFileSync(
    resolve(TEST_ROOT, ".beastmode", "state", "design", `${TEST_DATE}-${slug}.md`),
    `# ${slug}\n`,
  );
}

function writeManifest(
  slug: string,
  manifest: Record<string, unknown>,
): void {
  writeFileSync(
    resolve(TEST_ROOT, ".beastmode", "state", "plan", `${TEST_DATE}-${slug}.manifest.json`),
    JSON.stringify(manifest, null, 2),
  );
}

function makeManifest(
  slug: string,
  features: Array<{ slug: string; status: string }>,
  opts?: { phase?: string; github?: { epic: number; repo: string } },
): Record<string, unknown> {
  return {
    design: `.beastmode/state/design/${TEST_DATE}-${slug}.md`,
    architecturalDecisions: [],
    features: features.map((f) => ({
      slug: f.slug,
      plan: `${TEST_DATE}-${slug}-${f.slug}.md`,
      status: f.status,
    })),
    ...(opts?.phase ? { phase: opts.phase } : {}),
    ...(opts?.github ? { github: opts.github } : {}),
    lastUpdated: `${TEST_DATE}T00:00:00Z`,
  };
}

// ─── slugFromDesign ──────────────────────────────────────

describe("slugFromDesign", () => {
  test("extracts slug from dated design filename", () => {
    expect(slugFromDesign("2026-03-28-my-epic.md")).toBe("my-epic");
  });

  test("handles multi-segment slugs", () => {
    expect(slugFromDesign("2026-03-28-typescript-pipeline-orchestrator.md"))
      .toBe("typescript-pipeline-orchestrator");
  });

  test("handles filename without date prefix", () => {
    expect(slugFromDesign("my-epic.md")).toBe("my-epic");
  });
});

// ─── resolveConflicts ────────────────────────────────────

describe("resolveConflicts", () => {
  test("returns unchanged string when no conflict markers", () => {
    const input = '{"key": "value"}';
    expect(resolveConflicts(input)).toBe(input);
  });

  test("extracts ours-side from single conflict block", () => {
    const input = [
      "{",
      "<<<<<<< HEAD",
      '  "phase": "implement"',
      "=======",
      '  "phase": "validate"',
      ">>>>>>> feature-branch",
      "}",
    ].join("\n");

    const result = resolveConflicts(input);
    expect(result).toContain('"phase": "implement"');
    expect(result).not.toContain('"phase": "validate"');
    expect(result).not.toContain("<<<<<<<");
    expect(result).not.toContain(">>>>>>>");
  });

  test("handles multiple conflict blocks", () => {
    const input = [
      "{",
      "<<<<<<< HEAD",
      '  "a": 1,',
      "=======",
      '  "a": 2,',
      ">>>>>>> branch",
      "<<<<<<< HEAD",
      '  "b": 3',
      "=======",
      '  "b": 4',
      ">>>>>>> branch",
      "}",
    ].join("\n");

    const result = resolveConflicts(input);
    expect(result).toContain('"a": 1');
    expect(result).toContain('"b": 3');
    expect(result).not.toContain('"a": 2');
    expect(result).not.toContain('"b": 4');
  });

  test("resolved content is valid JSON when original was valid around markers", () => {
    const input = [
      "{",
      "<<<<<<< HEAD",
      '  "phase": "implement"',
      "=======",
      '  "phase": "validate"',
      ">>>>>>> feature",
      "}",
    ].join("\n");

    const resolved = resolveConflicts(input);
    const parsed = JSON.parse(resolved);
    expect(parsed.phase).toBe("implement");
  });
});

// ─── scanEpics: comprehensive coverage ──────────────────

describe("scanEpics", () => {
  beforeEach(setupTestRoot);
  afterEach(() => {
    if (existsSync(TEST_ROOT)) rmSync(TEST_ROOT, { recursive: true });
  });

  // ─── empty / missing states ────────────────────────────

  test("returns empty array when design directory is empty", async () => {
    const epics = await scanEpics(TEST_ROOT);
    expect(epics).toEqual([]);
  });

  test("returns empty array when design directory does not exist", async () => {
    rmSync(resolve(TEST_ROOT, ".beastmode", "state", "design"), { recursive: true });
    const epics = await scanEpics(TEST_ROOT);
    expect(epics).toEqual([]);
  });

  // ─── design phase (no manifest) ───────────────────────

  test("design with no manifest -> phase design, nextAction plan", async () => {
    writeDesign("my-epic");
    const epics = await scanEpics(TEST_ROOT);

    expect(epics).toHaveLength(1);
    expect(epics[0].slug).toBe("my-epic");
    expect(epics[0].phase).toBe("design");
    expect(epics[0].nextAction).toEqual({
      phase: "plan",
      args: ["my-epic"],
      type: "single",
    });
  });

  // ─── manifest.phase direct read ───────────────────────

  test("manifest.phase = 'plan' -> phase plan", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [], { phase: "plan" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("plan");
    expect(epics[0].nextAction?.phase).toBe("plan");
  });

  test("manifest.phase = 'implement' with pending features -> fan-out", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
      { slug: "f2", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("implement");
    expect(epics[0].nextAction).toEqual({
      phase: "implement",
      args: ["my-epic"],
      type: "fan-out",
      features: ["f1", "f2"],
    });
  });

  test("manifest.phase = 'validate' -> nextAction validate", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
    ], { phase: "validate" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("validate");
    expect(epics[0].nextAction).toEqual({
      phase: "validate",
      args: ["my-epic"],
      type: "single",
    });
  });

  test("manifest.phase = 'release' -> nextAction release", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
    ], { phase: "release" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("release");
    expect(epics[0].nextAction).toEqual({
      phase: "release",
      args: ["my-epic"],
      type: "single",
    });
  });

  test("manifest.phase = 'released' -> terminal, no nextAction", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
    ], { phase: "released" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("released");
    expect(epics[0].nextAction).toBeNull();
  });

  // ─── structural fallback (no phase field) ─────────────

  test("manifest without phase, no features -> plan (structural fallback)", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", []));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("plan");
  });

  test("manifest without phase, all features completed -> validate (structural fallback)", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
      { slug: "f2", status: "completed" },
    ]));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("validate");
    expect(epics[0].nextAction?.phase).toBe("validate");
  });

  test("manifest without phase, pending features -> implement (structural fallback)", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
      { slug: "f2", status: "pending" },
    ]));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].phase).toBe("implement");
    expect(epics[0].nextAction?.features).toEqual(["f2"]);
  });

  // ─── mixed completed/pending features ─────────────────

  test("fan-out includes in-progress features", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
      { slug: "f2", status: "pending" },
      { slug: "f3", status: "in-progress" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].nextAction?.features).toEqual(["f2", "f3"]);
  });

  // ─── blocked features ─────────────────────────────────

  test("blocked feature sets blocked and gateBlocked flags", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "blocked" },
      { slug: "f2", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].blocked).toBe(true);
    expect(epics[0].gateBlocked).toBe(true);
    expect(epics[0].gateName).toBe("feature-blocked");
    expect(epics[0].blockedGate).toBe("feature-blocked");
  });

  test("no blocked features -> blocked is false", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].blocked).toBe(false);
    expect(epics[0].gateBlocked).toBe(false);
  });

  // ─── feature progress extraction ──────────────────────

  test("extracts feature progress with github issues", async () => {
    writeDesign("my-epic");
    const manifest = makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
      { slug: "f2", status: "pending" },
    ], { phase: "implement" });
    // Add github issues to features
    (manifest.features as Array<Record<string, unknown>>)[0].github = { issue: 10 };
    (manifest.features as Array<Record<string, unknown>>)[1].github = { issue: 11 };
    writeManifest("my-epic", manifest);
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].features).toEqual([
      { slug: "f1", status: "completed", githubIssue: 10 },
      { slug: "f2", status: "pending", githubIssue: 11 },
    ]);
  });

  test("features without github have undefined githubIssue", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "completed" },
      { slug: "f2", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].features).toEqual([
      { slug: "f1", status: "completed", githubIssue: undefined },
      { slug: "f2", status: "pending", githubIssue: undefined },
    ]);
  });

  // ─── github epic issue ────────────────────────────────

  test("preserves github epic issue from manifest", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement", github: { epic: 42, repo: "user/repo" } }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].githubEpicIssue).toBe(42);
  });

  test("githubEpicIssue is undefined when manifest has no github", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].githubEpicIssue).toBeUndefined();
  });

  // ─── multiple epics ───────────────────────────────────

  test("handles multiple epics simultaneously", async () => {
    writeDesign("epic-one");
    writeDesign("epic-two");
    writeManifest("epic-one", makeManifest("epic-one", [
      { slug: "f1", status: "completed" },
    ], { phase: "validate" }));
    // epic-two has no manifest

    const epics = await scanEpics(TEST_ROOT);
    expect(epics).toHaveLength(2);

    const one = epics.find((e) => e.slug === "epic-one")!;
    const two = epics.find((e) => e.slug === "epic-two")!;

    expect(one.phase).toBe("validate");
    expect(two.phase).toBe("design");
  });

  // ─── slug collision detection ─────────────────────────

  test("slug collision: newest design file wins", async () => {
    // Two design files that resolve to same slug
    writeFileSync(
      resolve(TEST_ROOT, ".beastmode", "state", "design", "2026-03-28-my-epic.md"),
      "# old\n",
    );
    writeFileSync(
      resolve(TEST_ROOT, ".beastmode", "state", "design", "2026-03-29-my-epic.md"),
      "# new\n",
    );
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement" }));

    const epics = await scanEpics(TEST_ROOT);

    // Only one epic for the slug
    const myEpics = epics.filter((e) => e.slug === "my-epic");
    expect(myEpics).toHaveLength(1);
    // Winner is the newest (2026-03-29)
    expect(myEpics[0].designPath).toContain("2026-03-29");
  });

  // ─── merge conflict resolution in manifests ───────────

  test("auto-resolves merge conflicts in manifest files", async () => {
    writeDesign("my-epic");
    // Write a manifest with conflict markers
    const conflicted = [
      "{",
      '  "design": ".beastmode/state/design/2026-03-29-my-epic.md",',
      '  "architecturalDecisions": [],',
      '  "features": [',
      "<<<<<<< HEAD",
      '    {"slug": "f1", "plan": "f1.md", "status": "pending"}',
      "=======",
      '    {"slug": "f1", "plan": "f1.md", "status": "completed"}',
      ">>>>>>> other-branch",
      "  ],",
      '  "phase": "implement",',
      `  "lastUpdated": "${TEST_DATE}T00:00:00Z"`,
      "}",
    ].join("\n");
    writeFileSync(
      resolve(TEST_ROOT, ".beastmode", "state", "plan", `${TEST_DATE}-my-epic.manifest.json`),
      conflicted,
    );

    const epics = await scanEpics(TEST_ROOT);
    expect(epics).toHaveLength(1);
    expect(epics[0].phase).toBe("implement");
    // Ours-side: status "pending"
    expect(epics[0].features[0].status).toBe("pending");
  });

  // ─── empty / corrupt manifests ────────────────────────

  test("empty manifest file is skipped gracefully", async () => {
    writeDesign("my-epic");
    writeFileSync(
      resolve(TEST_ROOT, ".beastmode", "state", "plan", `${TEST_DATE}-my-epic.manifest.json`),
      "",
    );

    const epics = await scanEpics(TEST_ROOT);
    // Falls through to "no manifest" -> design phase
    expect(epics[0].phase).toBe("design");
  });

  test("whitespace-only manifest file is skipped gracefully", async () => {
    writeDesign("my-epic");
    writeFileSync(
      resolve(TEST_ROOT, ".beastmode", "state", "plan", `${TEST_DATE}-my-epic.manifest.json`),
      "   \n\n  ",
    );

    const epics = await scanEpics(TEST_ROOT);
    expect(epics[0].phase).toBe("design");
  });

  test("corrupt JSON manifest is skipped gracefully", async () => {
    writeDesign("my-epic");
    writeFileSync(
      resolve(TEST_ROOT, ".beastmode", "state", "plan", `${TEST_DATE}-my-epic.manifest.json`),
      "{ not valid json",
    );

    const epics = await scanEpics(TEST_ROOT);
    expect(epics[0].phase).toBe("design");
  });

  // ─── no costUsd in output ─────────────────────────────

  test("EpicState does not include costUsd property", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0]).not.toHaveProperty("costUsd");
  });

  // ─── manifest path tracking ───────────────────────────

  test("manifestPath is set when manifest exists", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement" }));
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].manifestPath).toBeDefined();
    expect(epics[0].manifestPath).toContain("my-epic.manifest.json");
  });

  test("manifestPath is undefined when no manifest", async () => {
    writeDesign("my-epic");
    const epics = await scanEpics(TEST_ROOT);

    expect(epics[0].manifestPath).toBeUndefined();
  });

  // ─── pure read-only ───────────────────────────────────

  test("pure read-only -- does not write to filesystem", async () => {
    writeDesign("my-epic");
    writeManifest("my-epic", makeManifest("my-epic", [
      { slug: "f1", status: "pending" },
    ], { phase: "implement" }));

    const designPath = resolve(TEST_ROOT, ".beastmode", "state", "design", `${TEST_DATE}-my-epic.md`);
    const manifestPath = resolve(TEST_ROOT, ".beastmode", "state", "plan", `${TEST_DATE}-my-epic.manifest.json`);
    const designBefore = Bun.file(designPath).lastModified;
    const manifestBefore = Bun.file(manifestPath).lastModified;

    await scanEpics(TEST_ROOT);

    expect(Bun.file(designPath).lastModified).toBe(designBefore);
    expect(Bun.file(manifestPath).lastModified).toBe(manifestBefore);
  });
});
