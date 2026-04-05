/**
 * Unit tests for sync-refs — GitHub sync file I/O.
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  loadSyncRefs,
  saveSyncRefs,
  getSyncRef,
  setSyncRef,
  type SyncRefs,
} from "../github/sync-refs";

describe("sync-refs", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "sync-refs-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("getSyncRef / setSyncRef (pure)", () => {
    test("returns undefined for missing entity", () => {
      const refs: SyncRefs = {};
      expect(getSyncRef(refs, "bm-1234")).toBeUndefined();
    });

    test("sets and gets a sync ref", () => {
      let refs: SyncRefs = {};
      refs = setSyncRef(refs, "bm-1234", { issue: 42 });
      const ref = getSyncRef(refs, "bm-1234");
      expect(ref).toEqual({ issue: 42 });
    });

    test("sets ref with bodyHash", () => {
      let refs: SyncRefs = {};
      refs = setSyncRef(refs, "bm-1234", { issue: 42, bodyHash: "abc" });
      expect(getSyncRef(refs, "bm-1234")).toEqual({ issue: 42, bodyHash: "abc" });
    });

    test("overwrites existing ref", () => {
      let refs: SyncRefs = {};
      refs = setSyncRef(refs, "bm-1234", { issue: 42 });
      refs = setSyncRef(refs, "bm-1234", { issue: 99, bodyHash: "xyz" });
      expect(getSyncRef(refs, "bm-1234")).toEqual({ issue: 99, bodyHash: "xyz" });
    });

    test("setSyncRef returns a new object (immutable)", () => {
      const refs: SyncRefs = {};
      const updated = setSyncRef(refs, "bm-1234", { issue: 42 });
      expect(refs).toEqual({});
      expect(updated).toEqual({ "bm-1234": { issue: 42 } });
    });
  });

  describe("loadSyncRefs / saveSyncRefs (I/O)", () => {
    test("returns empty object when file does not exist", () => {
      const refs = loadSyncRefs(tmpDir);
      expect(refs).toEqual({});
    });

    test("round-trips save then load", () => {
      const refs: SyncRefs = {
        "bm-1234": { issue: 42 },
        "bm-5678": { issue: 99, bodyHash: "abc" },
      };
      saveSyncRefs(tmpDir, refs);
      const loaded = loadSyncRefs(tmpDir);
      expect(loaded).toEqual(refs);
    });

    test("saves to .beastmode/state/github-sync.json", () => {
      saveSyncRefs(tmpDir, { "bm-1": { issue: 1 } });
      const filePath = join(tmpDir, ".beastmode", "state", "github-sync.json");
      const content = JSON.parse(readFileSync(filePath, "utf-8"));
      expect(content).toEqual({ "bm-1": { issue: 1 } });
    });

    test("handles empty refs object", () => {
      saveSyncRefs(tmpDir, {});
      const loaded = loadSyncRefs(tmpDir);
      expect(loaded).toEqual({});
    });
  });
});
