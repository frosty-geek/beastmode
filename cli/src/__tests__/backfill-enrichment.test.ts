import { describe, it, expect, vi, beforeEach } from "vitest";
import type { BackfillDeps } from "../scripts/backfill-enrichment.js";

describe("backfill-enrichment", () => {
  let mockList: ReturnType<typeof vi.fn>;
  let mockLoad: ReturnType<typeof vi.fn>;
  let mockSyncForEpic: ReturnType<typeof vi.fn>;
  let mockLoadConfig: ReturnType<typeof vi.fn>;
  let mockDiscoverGitHub: ReturnType<typeof vi.fn>;
  let mockHasRemote: ReturnType<typeof vi.fn>;
  let mockPushBranches: ReturnType<typeof vi.fn>;
  let mockPushTags: ReturnType<typeof vi.fn>;
  let mockAmendCommitsInRange: ReturnType<typeof vi.fn>;
  let mockLinkBranches: ReturnType<typeof vi.fn>;
  let mockGit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockList = vi.fn();
    mockLoad = vi.fn();
    mockSyncForEpic = vi.fn();
    mockLoadConfig = vi.fn();
    mockDiscoverGitHub = vi.fn();
    mockHasRemote = vi.fn();
    mockPushBranches = vi.fn();
    mockPushTags = vi.fn();
    mockAmendCommitsInRange = vi.fn();
    mockLinkBranches = vi.fn();
    mockGit = vi.fn();
  });

  async function runBackfill(projectRoot: string) {
    const { backfill } = await import("../scripts/backfill-enrichment.js");
    return backfill(projectRoot, {
      list: mockList,
      load: mockLoad,
      syncGitHubForEpic: mockSyncForEpic,
      loadConfig: mockLoadConfig,
      discoverGitHub: mockDiscoverGitHub,
      hasRemote: mockHasRemote,
      pushBranches: mockPushBranches,
      pushTags: mockPushTags,
      amendCommitsInRange: mockAmendCommitsInRange,
      linkBranches: mockLinkBranches,
      git: mockGit,
    } as unknown as BackfillDeps);
  }

  it("skips manifests without github.epic", async () => {
    mockLoadConfig.mockReturnValue({ github: { enabled: true } });
    mockHasRemote.mockResolvedValue(false);
    mockList.mockReturnValue([
      { slug: "no-github", phase: "design", features: [], artifacts: {}, lastUpdated: "" },
      { slug: "has-github", phase: "design", features: [], artifacts: {}, lastUpdated: "", github: { epic: 42, repo: "owner/repo" } },
    ]);
    mockLoad.mockReturnValue(null);
    mockSyncForEpic.mockResolvedValue(undefined);
    mockAmendCommitsInRange.mockResolvedValue({ amended: 0 });

    const result = await runBackfill("/project");

    expect(mockSyncForEpic).toHaveBeenCalledTimes(1);
    expect(mockSyncForEpic).toHaveBeenCalledWith(expect.objectContaining({
      projectRoot: "/project",
      epicSlug: "has-github",
    }));
    expect(result.skipped).toBe(1);
    expect(result.synced).toBe(1);
  });

  it("reports errors without stopping", async () => {
    mockLoadConfig.mockReturnValue({ github: { enabled: true } });
    mockHasRemote.mockResolvedValue(false);
    mockList.mockReturnValue([
      { slug: "epic-a", phase: "plan", features: [], artifacts: {}, lastUpdated: "", github: { epic: 1, repo: "o/r" } },
      { slug: "epic-b", phase: "plan", features: [], artifacts: {}, lastUpdated: "", github: { epic: 2, repo: "o/r" } },
    ]);
    mockLoad.mockReturnValue(null);
    mockSyncForEpic
      .mockRejectedValueOnce(new Error("API rate limit"))
      .mockResolvedValueOnce(undefined);
    mockAmendCommitsInRange.mockResolvedValue({ amended: 0 });

    const result = await runBackfill("/project");

    expect(result.errored).toBe(1);
    expect(result.synced).toBe(1);
    expect(result.epics.find((e) => e.slug === "epic-a")?.error).toContain("API rate limit");
  });

  it("handles empty manifest list", async () => {
    mockLoadConfig.mockReturnValue({ github: { enabled: true } });
    mockHasRemote.mockResolvedValue(false);
    mockList.mockReturnValue([]);

    const result = await runBackfill("/project");

    expect(result.synced).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errored).toBe(0);
  });
});
