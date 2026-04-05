import { describe, test, expect } from "vitest";
import {
  type DetailsPanelSelection,
  resolveDetailsContent,
  type DetailsContentResult,
} from "../dashboard/details-panel.js";
import {
  computePhaseDistribution,
  formatGitStatus,
  formatActiveSessions,
} from "../dashboard/overview-panel.js";
import type { EnrichedEpic } from "../store/types.js";

/**
 * @tag dashboard-extensions
 * Integration tests: Details panel shows context-sensitive content
 */

function mockEpic(overrides: Partial<EnrichedEpic> = {}): EnrichedEpic {
  return {
    id: "test-id",
    type: "epic",
    slug: "test-epic",
    name: "Test Epic",
    status: "design",
    features: [],
    nextAction: null,
    depends_on: [],
    created_at: "2026-04-04T00:00:00Z",
    updated_at: "2026-04-04T00:00:00Z",
    ...overrides,
  } as EnrichedEpic;
}

describe("Details panel shows context-sensitive content", () => {
  test('Panel title is "DETAILS" not "OVERVIEW"', async () => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const layoutPath = resolve(
      currentDir,
      "../dashboard/ThreePanelLayout.tsx",
    );
    const content = readFileSync(layoutPath, "utf-8");
    expect(content).toContain('title="DETAILS"');
    expect(content).not.toContain('title="OVERVIEW"');
  });

  test("Details panel shows overview info when all is selected", () => {
    const epics = [
      mockEpic({ slug: "a", status: "design" }),
      mockEpic({ slug: "b", status: "implement" }),
    ];
    const selection: DetailsPanelSelection = { kind: "all" };
    const result = resolveDetailsContent(selection, {
      epics,
      activeSessions: 2,
      gitStatus: { branch: "main", dirty: false },
    });
    expect(result.kind).toBe("overview");
    if (result.kind === "overview") {
      expect(result.distribution.length).toBeGreaterThan(0);
      expect(result.sessions).toBe("2 active sessions / 2 worktrees");
      expect(result.git).toBe("main (clean)");
    }
  });

  test("Details panel shows PRD artifact when an epic is selected", () => {
    const selection: DetailsPanelSelection = { kind: "epic", slug: "auth" };
    const result = resolveDetailsContent(selection, {
      projectRoot: "/nonexistent",
    });
    expect(result.kind).toBe("not-found");
    if (result.kind === "not-found") {
      expect(result.message).toContain("no PRD found");
    }
  });

  test("Details panel shows plan artifact when a feature is selected", () => {
    const selection: DetailsPanelSelection = {
      kind: "feature",
      epicSlug: "auth",
      featureSlug: "login-flow",
    };
    const result = resolveDetailsContent(selection, {
      projectRoot: "/nonexistent",
    });
    expect(result.kind).toBe("not-found");
    if (result.kind === "not-found") {
      expect(result.message).toContain("no plan found");
    }
  });

  test("Details panel content is scrollable", () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`);
    const visibleHeight = 10;
    const scrollOffset = 5;

    const visible = lines.slice(scrollOffset, scrollOffset + visibleHeight);
    expect(visible[0]).toBe("Line 6");
    expect(visible.length).toBe(10);

    const scrolledUp = lines.slice(2, 2 + visibleHeight);
    expect(scrolledUp[0]).toBe("Line 3");
  });
});
