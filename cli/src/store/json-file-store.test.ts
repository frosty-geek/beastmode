import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { JsonFileStore } from "./json-file-store.js";
import { existsSync, mkdirSync, rmSync, readFileSync } from "fs";
import { resolve } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

describe("JsonFileStore", () => {
  let storeDir: string;
  let storePath: string;
  let store: JsonFileStore;

  beforeEach(() => {
    storeDir = resolve(tmpdir(), `beastmode-test-${randomUUID()}`);
    mkdirSync(storeDir, { recursive: true });
    storePath = resolve(storeDir, "store.json");
    store = new JsonFileStore(storePath);
  });

  afterEach(() => {
    rmSync(storeDir, { recursive: true, force: true });
  });

  describe("load/save round-trip", () => {
    it("should create store file on first save", () => {
      const epic = store.addEpic({ name: "Test Epic" });
      store.save();

      expect(existsSync(storePath)).toBe(true);

      const raw = JSON.parse(readFileSync(storePath, "utf-8"));
      expect(raw.version).toBe(1);
      expect(raw.entities[epic.id]).toBeDefined();
      expect(raw.entities[epic.id].name).toBe("Test Epic");
    });

    it("should load existing store from file", () => {
      const epic = store.addEpic({ name: "Test Epic" });
      const feature = store.addFeature({ parent: epic.id, name: "Feature 1" });
      store.save();

      // Create new store instance pointing to same file
      const store2 = new JsonFileStore(storePath);
      store2.load();

      const loadedEpic = store2.getEpic(epic.id);
      expect(loadedEpic).toBeDefined();
      expect(loadedEpic!.name).toBe("Test Epic");

      const loadedFeature = store2.getFeature(feature.id);
      expect(loadedFeature).toBeDefined();
      expect(loadedFeature!.name).toBe("Feature 1");
      expect(loadedFeature!.parent).toBe(epic.id);
    });

    it("should preserve all entity fields through save/load", () => {
      const epic = store.addEpic({ name: "My Epic", slug: "my-epic" });
      store.updateEpic(epic.id, {
        status: "implement",
        summary: "A summary",
        design: "artifacts/design/2026-04-04-my-epic.md",
        depends_on: [],
        worktree: { branch: "feature/my-epic", path: ".claude/worktrees/my-epic" },
      });

      const feature = store.addFeature({ parent: epic.id, name: "Feature", description: "Desc" });
      store.updateFeature(feature.id, {
        status: "in-progress",
        plan: "artifacts/plan/2026-04-04-my-epic-feature.md",
        depends_on: [],
      });

      store.save();

      const store2 = new JsonFileStore(storePath);
      store2.load();

      const e = store2.getEpic(epic.id)!;
      expect(e.status).toBe("implement");
      expect(e.summary).toBe("A summary");
      expect(e.design).toBe("artifacts/design/2026-04-04-my-epic.md");
      expect(e.worktree).toEqual({ branch: "feature/my-epic", path: ".claude/worktrees/my-epic" });

      const f = store2.getFeature(feature.id)!;
      expect(f.status).toBe("in-progress");
      expect(f.plan).toBe("artifacts/plan/2026-04-04-my-epic-feature.md");
      expect(f.description).toBe("Desc");
    });

    it("should handle load when file does not exist (empty store)", () => {
      store.load(); // Should not throw
      expect(store.listEpics()).toEqual([]);
    });

    it("should create parent directory on save if needed", () => {
      const nestedPath = resolve(storeDir, "nested", "deep", "store.json");
      const nestedStore = new JsonFileStore(nestedPath);
      nestedStore.addEpic({ name: "Epic" });
      nestedStore.save();
      expect(existsSync(nestedPath)).toBe(true);
    });
  });
});
