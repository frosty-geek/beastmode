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

  beforeEach(() => {
    store = new InMemoryTaskStore();
    // Background: two epics with collision-proof slugs
    store.addEpic({ name: "Dashboard Redesign", slug: "dashboard-redesign-f3a7" });
    store.addEpic({ name: "Auth System", slug: "auth-system-b2c4" });
  });

  it("Exact slug match takes priority over prefix match", () => {
    const result = resolveIdentifier(store, "dashboard-redesign-f3a7");
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.slug).toBe("dashboard-redesign-f3a7");
    }
  });

  it("Prefix match resolves to full slug", () => {
    const result = resolveIdentifier(store, "dashboard-redesign", {
      allowPrefix: true,
    });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.slug).toBe("dashboard-redesign-f3a7");
    }
  });

  it("Prefix match works with partial name", () => {
    const result = resolveIdentifier(store, "dashboard", {
      allowPrefix: true,
    });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.slug).toBe("dashboard-redesign-f3a7");
    }
  });

  it("Ambiguous prefix match returns an error", () => {
    // Add a second dashboard-prefixed epic
    store.addEpic({ name: "Dashboard Metrics", slug: "dashboard-metrics-e5f6" });

    const result = resolveIdentifier(store, "dashboard", {
      allowPrefix: true,
    });
    expect(result.kind).toBe("ambiguous");
    if (result.kind === "ambiguous") {
      const slugs = result.matches.map((e) => e.slug).sort();
      expect(slugs).toContain("dashboard-redesign-f3a7");
      expect(slugs).toContain("dashboard-metrics-e5f6");
    }
  });

  it("Exact entity ID match takes priority over prefix", () => {
    // Look up by entity ID — should match by ID, not prefix
    const epics = store.listEpics();
    const target = epics.find((e) => e.slug === "dashboard-redesign-f3a7")!;
    const result = resolveIdentifier(store, target.id, {
      allowPrefix: true,
    });
    expect(result.kind).toBe("found");
    if (result.kind === "found") {
      expect(result.entity.id).toBe(target.id);
    }
  });

  it("Internal callers use exact match only (no prefix expansion)", () => {
    // Without allowPrefix, "dashboard-redesign" should NOT match "dashboard-redesign-f3a7"
    const result = resolveIdentifier(store, "dashboard-redesign");
    expect(result.kind).toBe("not-found");
  });
});
