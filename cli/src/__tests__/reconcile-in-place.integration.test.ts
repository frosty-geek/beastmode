/**
 * Integration test: Design reconciliation updates slug in-place — entity ID remains stable.
 *
 * Tests that updating the name on an epic automatically derives a new slug
 * while preserving the bm-XXXX entity ID.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTaskStore } from "../store/in-memory.js";


describe("Design reconciliation updates slug in-place", () => {
  let store: InMemoryTaskStore;

  beforeEach(() => {
    store = new InMemoryTaskStore();
  });

  describe("Reconcile design updates slug via name change without changing entity ID", () => {
    it("should derive new slug when name changes and preserve entity ID", () => {
      const seeded = store.addEpic({ name: "a1b2" });
      const originalId = seeded.id;
      const hex = originalId.replace("bm-", "");

      // Simulate design rename: update name triggers slug derivation
      const updated = store.updateEpic(seeded.id, { name: "oauth-redesign" });

      // Entity ID must be identical
      expect(updated.id).toBe(originalId);
      // Slug must be derived from new name + hex
      expect(updated.slug).toBe(`oauth-redesign-${hex}`);
      // Must be retrievable by original ID
      const retrieved = store.getEpic(originalId);
      expect(retrieved).toBeDefined();
      expect(retrieved!.slug).toBe(`oauth-redesign-${hex}`);
      expect(retrieved!.id).toBe(originalId);
    });
  });

  describe("Reconcile design preserves summary metadata", () => {
    it("should retain summary fields through name-driven slug rename", () => {
      const seeded = store.addEpic({ name: "a1b2" });
      const originalId = seeded.id;
      const hex = originalId.replace("bm-", "");

      // Update with name + summary in one call
      const updated = store.updateEpic(seeded.id, {
        name: "oauth-redesign",
        summary: "Auth is broken — Redesign OAuth flow",
        design: "2026-04-11-oauth-redesign.md",
        status: "plan",
      });

      expect(updated.id).toBe(originalId);
      expect(updated.slug).toBe(`oauth-redesign-${hex}`);
      expect(updated.summary).toBe("Auth is broken — Redesign OAuth flow");
      expect(updated.design).toBe("2026-04-11-oauth-redesign.md");
      expect(updated.status).toBe("plan");
    });
  });

  describe("No orphaned entities after reconciliation", () => {
    it("should not leave old entities in the store", () => {
      const seeded = store.addEpic({ name: "a1b2" });
      const hex = seeded.id.replace("bm-", "");

      store.updateEpic(seeded.id, { name: "oauth-redesign" });

      // Only one epic should exist
      const allEpics = store.listEpics();
      expect(allEpics).toHaveLength(1);
      expect(allEpics[0].slug).toBe(`oauth-redesign-${hex}`);

      // Old slug should not be found in the list
      const oldSlugMatch = store.listEpics().find((e) => e.slug === seeded.slug);
      expect(oldSlugMatch).toBeUndefined();

      // New slug should be found
      const newSlugMatch = store.listEpics().find((e) => e.slug === `oauth-redesign-${hex}`);
      expect(newSlugMatch).toBeDefined();
      expect(newSlugMatch!.id).toBe(seeded.id);
    });
  });
});
