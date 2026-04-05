import { describe, test, expect } from "vitest";
import { FEATURE_STATUS_COLOR, isFeatureDim } from "../dashboard/monokai-palette.js";
import { buildFlatRows, rowSlugAtIndex } from "../dashboard/epics-tree-model.js";
import type { SelectableRow } from "../dashboard/epics-tree-model.js";
import type { EnrichedEpic, Feature } from "../store/types.js";

describe("feature status colors", () => {
  test("pending maps to muted gray", () => {
    expect(FEATURE_STATUS_COLOR["pending"]).toBe("#727072");
  });

  test("in-progress maps to implement yellow", () => {
    expect(FEATURE_STATUS_COLOR["in-progress"]).toBe("#FFD866");
  });

  test("completed maps to done green", () => {
    expect(FEATURE_STATUS_COLOR["completed"]).toBe("#A9DC76");
  });

  test("blocked maps to blocked red", () => {
    expect(FEATURE_STATUS_COLOR["blocked"]).toBe("#FF6188");
  });

  test("isFeatureDim returns true for completed", () => {
    expect(isFeatureDim("completed")).toBe(true);
  });

  test("isFeatureDim returns false for in-progress", () => {
    expect(isFeatureDim("in-progress")).toBe(false);
  });

  test("isFeatureDim returns false for pending", () => {
    expect(isFeatureDim("pending")).toBe(false);
  });

  test("isFeatureDim returns false for blocked", () => {
    expect(isFeatureDim("blocked")).toBe(false);
  });
});

function makeEpic(slug: string, status: string, features: Partial<Feature>[]): EnrichedEpic {
  return {
    id: slug,
    type: "epic",
    name: slug,
    slug,
    status: status as EnrichedEpic["status"],
    depends_on: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    nextAction: null,
    features: features.map((f, i) => ({
      id: `${slug}-f${i}`,
      type: "feature" as const,
      parent: slug,
      name: f.slug ?? `feature-${i}`,
      slug: f.slug ?? `feature-${i}`,
      status: f.status ?? "pending",
      depends_on: [],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    })),
  };
}

describe("buildFlatRows", () => {
  test("no epics returns only (all) row", () => {
    const rows = buildFlatRows([], undefined);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe("all");
  });

  test("no expansion returns (all) + epic rows only", () => {
    const epics = [
      makeEpic("auth", "implement", [{ slug: "login" }]),
      makeEpic("pipe", "plan", [{ slug: "watch" }]),
    ];
    const rows = buildFlatRows(epics, undefined);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.type)).toEqual(["all", "epic", "epic"]);
  });

  test("expanding an epic inserts its feature rows after it", () => {
    const epics = [
      makeEpic("auth", "implement", [{ slug: "login" }, { slug: "token" }]),
      makeEpic("pipe", "plan", [{ slug: "watch" }]),
    ];
    const rows = buildFlatRows(epics, "auth");
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.type)).toEqual(["all", "epic", "feature", "feature", "epic"]);
    expect(rows[2].slug).toBe("login");
    expect(rows[3].slug).toBe("token");
  });

  test("expanding non-existent slug produces no feature rows", () => {
    const epics = [makeEpic("auth", "implement", [{ slug: "login" }])];
    const rows = buildFlatRows(epics, "nope");
    expect(rows).toHaveLength(2);
  });

  test("feature rows carry epicSlug", () => {
    const epics = [makeEpic("auth", "implement", [{ slug: "login", status: "in-progress" }])];
    const rows = buildFlatRows(epics, "auth");
    const featureRow = rows[2];
    expect(featureRow.type).toBe("feature");
    expect(featureRow.epicSlug).toBe("auth");
    expect(featureRow.featureStatus).toBe("in-progress");
  });

  test("epic with no features expands to nothing extra", () => {
    const epics = [makeEpic("empty", "design", [])];
    const rows = buildFlatRows(epics, "empty");
    expect(rows).toHaveLength(2);
  });
});

describe("rowSlugAtIndex", () => {
  test("index 0 returns undefined (all)", () => {
    const rows = buildFlatRows([], undefined);
    expect(rowSlugAtIndex(rows, 0)).toBeUndefined();
  });

  test("epic row returns slug string", () => {
    const epics = [makeEpic("auth", "implement", [])];
    const rows = buildFlatRows(epics, undefined);
    expect(rowSlugAtIndex(rows, 1)).toBe("auth");
  });

  test("feature row returns { epicSlug, featureSlug } tuple", () => {
    const epics = [makeEpic("auth", "implement", [{ slug: "login" }])];
    const rows = buildFlatRows(epics, "auth");
    expect(rowSlugAtIndex(rows, 2)).toEqual({ epicSlug: "auth", featureSlug: "login" });
  });

  test("out-of-range returns undefined", () => {
    const rows = buildFlatRows([], undefined);
    expect(rowSlugAtIndex(rows, 99)).toBeUndefined();
  });
});
