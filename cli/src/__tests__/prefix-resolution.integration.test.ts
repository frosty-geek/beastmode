/**
 * BDD integration test for CLI prefix resolution.
 *
 * @collision-proof-slugs @cli
 * Feature: CLI prefix resolution -- human-readable prefix resolves to full slug
 */

import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryTaskStore } from "../store/in-memory.js";
import { resolveIdentifier } from "../store/resolve.js";

describe("CLI prefix resolution", () => {
  let store: InMemoryTaskStore;
  let dashboardEpic: { id: string; slug: string };
  let authEpic: { id: string; slug: string };

  beforeEach(() => {
    store = new InMemoryTaskStore();
    // Background: two epics with collision-proof slugs (name-hexSuffix format)
    // Use addEpic then directly set slug via the entities map (slug is immutable in updateEpic)
    const d = store.addEpic({ name: "Dashboard Redesign" });
    (d as any).slug = "dashboard-redesign-f3a7";
    dashboardEpic = { id: d.id, slug: "dashboard-redesign-f3a7" };
    const a = store.addEpic({ name: "Auth System" });
    (a as any).slug = "auth-system-b2c4";
    authEpic = { id: a.id, slug: "auth-system-b2c4" };
  });

  it("Exact slug match takes priority over prefix match", () => {
    const result = resolveIdentifier(store, dashboardEpic.slug);
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.slug).toBe(dashboardEpic.slug);
    }
  });

  it("Prefix match resolves to full slug", () => {
    const result = resolveIdentifier(store, "dashboard-redesign", {
      allowPrefix: true,
    });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.slug).toBe(dashboardEpic.slug);
    }
  });

  it("Prefix match works with partial name", () => {
    const result = resolveIdentifier(store, "dashboard", {
      allowPrefix: true,
    });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.slug).toBe(dashboardEpic.slug);
    }
  });

  it("Ambiguous prefix match returns an error", () => {
    // Add a second dashboard-prefixed epic with collision-proof slug
    const m = store.addEpic({ name: "Dashboard Metrics" });
    (m as any).slug = "dashboard-metrics-e5f6";

    const result = resolveIdentifier(store, "dashboard", {
      allowPrefix: true,
    });
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      const slugs = result.matches.map((e) => e.slug).sort();
      expect(slugs).toContain(dashboardEpic.slug);
      expect(slugs).toContain("dashboard-metrics-e5f6");
    }
  });

  it("Exact entity ID match takes priority over prefix", () => {
    const result = resolveIdentifier(store, dashboardEpic.id, {
      allowPrefix: true,
    });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.id).toBe(dashboardEpic.id);
    }
  });

  it("Internal callers use exact match only (no prefix expansion)", () => {
    // Without allowPrefix, "dashboard-redesign" should NOT match the auto-derived slug
    const result = resolveIdentifier(store, "dashboard-redesign");
    expect(result.kind).toBe("not-found");
  });
});
