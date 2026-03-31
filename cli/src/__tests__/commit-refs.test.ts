import { describe, test, expect } from "bun:test";
import { buildCommitRefs } from "../commit-refs";
import type { PipelineManifest } from "../manifest-store";

function makeManifest(
  overrides: Partial<PipelineManifest> = {},
): PipelineManifest {
  return {
    slug: "test-epic",
    phase: "implement",
    features: [],
    artifacts: {},
    blocked: null,
    lastUpdated: "2026-03-31T00:00:00Z",
    ...overrides,
  };
}

describe("buildCommitRefs", () => {
  test("returns empty string when manifest has no github field", () => {
    const manifest = makeManifest();
    expect(buildCommitRefs(manifest)).toBe("");
  });

  test("returns empty string when manifest has no github field even with featureSlug", () => {
    const manifest = makeManifest();
    expect(buildCommitRefs(manifest, "some-feature")).toBe("");
  });

  test("returns epic-only ref when no featureSlug provided", () => {
    const manifest = makeManifest({
      github: { epic: 42, repo: "bugroger/beastmode" },
    });
    expect(buildCommitRefs(manifest)).toBe(
      "\n<commit-refs>\nRefs #42\n</commit-refs>",
    );
  });

  test("returns epic-only ref when featureSlug provided but feature has no github.issue", () => {
    const manifest = makeManifest({
      github: { epic: 42, repo: "bugroger/beastmode" },
      features: [{ slug: "feat-a", plan: "plan.md", status: "pending" }],
    });
    expect(buildCommitRefs(manifest, "feat-a")).toBe(
      "\n<commit-refs>\nRefs #42\n</commit-refs>",
    );
  });

  test("returns epic + feature refs when feature has github.issue", () => {
    const manifest = makeManifest({
      github: { epic: 42, repo: "bugroger/beastmode" },
      features: [
        {
          slug: "feat-a",
          plan: "plan.md",
          status: "in-progress",
          github: { issue: 99 },
        },
      ],
    });
    expect(buildCommitRefs(manifest, "feat-a")).toBe(
      "\n<commit-refs>\nRefs #42\nRefs #99\n</commit-refs>",
    );
  });

  test("returns epic-only ref when featureSlug does not match any feature", () => {
    const manifest = makeManifest({
      github: { epic: 42, repo: "bugroger/beastmode" },
      features: [
        {
          slug: "feat-a",
          plan: "plan.md",
          status: "pending",
          github: { issue: 99 },
        },
      ],
    });
    expect(buildCommitRefs(manifest, "nonexistent")).toBe(
      "\n<commit-refs>\nRefs #42\n</commit-refs>",
    );
  });
});
