import { describe, test, expect } from "vitest";
import type { TreeState, CliNode, EpicNode, FeatureNode, TreeEntry } from "../dashboard/tree-types.js";

describe("tree-types structure", () => {
  test("TreeEntry has phase field", () => {
    const entry: TreeEntry = {
      timestamp: 1000,
      level: "info",
      message: "test",
      seq: 0,
      phase: "implement",
    };
    expect(entry.phase).toBe("implement");
  });

  test("FeatureNode has status field", () => {
    const node: FeatureNode = {
      slug: "login-flow",
      status: "in-progress",
      entries: [],
    };
    expect(node.status).toBe("in-progress");
  });

  test("EpicNode has status and features (no phases)", () => {
    const node: EpicNode = {
      slug: "auth",
      status: "implement",
      features: [],
      entries: [],
    };
    expect(node.status).toBe("implement");
    expect(node.features).toEqual([]);
    expect(node).not.toHaveProperty("phases");
  });

  test("CliNode holds system entries", () => {
    const cli: CliNode = {
      entries: [{ timestamp: 1000, level: "info", message: "started", seq: 0 }],
    };
    expect(cli.entries).toHaveLength(1);
  });

  test("TreeState has cli and epics", () => {
    const state: TreeState = {
      cli: { entries: [] },
      epics: [],
    };
    expect(state.cli).toBeDefined();
    expect(state.epics).toEqual([]);
  });
});
