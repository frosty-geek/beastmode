import { describe, test, expect } from "bun:test";
import {
  formatEpicBody,
  formatFeatureBody,
  type EpicBodyInput,
  type FeatureBodyInput,
} from "../src/body-format";

describe("formatEpicBody", () => {
  test("includes phase badge", () => {
    const input: EpicBodyInput = {
      slug: "my-epic",
      phase: "implement",
      features: [],
    };
    const body = formatEpicBody(input);
    expect(body).toContain("**Phase:** implement");
  });

  test("includes problem and solution when summary exists", () => {
    const input: EpicBodyInput = {
      slug: "my-epic",
      phase: "design",
      summary: {
        problem: "Things are broken",
        solution: "Fix them",
      },
      features: [],
    };
    const body = formatEpicBody(input);
    expect(body).toContain("## Problem");
    expect(body).toContain("Things are broken");
    expect(body).toContain("## Solution");
    expect(body).toContain("Fix them");
  });

  test("omits problem/solution sections when summary is missing", () => {
    const input: EpicBodyInput = {
      slug: "my-epic",
      phase: "plan",
      features: [],
    };
    const body = formatEpicBody(input);
    expect(body).not.toContain("## Problem");
    expect(body).not.toContain("## Solution");
    // Still has phase badge
    expect(body).toContain("**Phase:** plan");
  });

  test("renders feature checklist with checkboxes", () => {
    const input: EpicBodyInput = {
      slug: "my-epic",
      phase: "implement",
      features: [
        { slug: "feat-a", status: "completed", github: { issue: 10 } },
        { slug: "feat-b", status: "in-progress", github: { issue: 11 } },
        { slug: "feat-c", status: "pending" },
      ],
    };
    const body = formatEpicBody(input);
    expect(body).toContain("- [x] #10 feat-a");
    expect(body).toContain("- [ ] #11 feat-b");
    expect(body).toContain("- [ ] feat-c feat-c"); // unlinked — plain slug as ref
  });

  test("excludes cancelled features from checklist", () => {
    const input: EpicBodyInput = {
      slug: "my-epic",
      phase: "plan",
      features: [
        { slug: "feat-a", status: "pending" },
        { slug: "feat-cancelled", status: "cancelled" as any },
        { slug: "feat-b", status: "completed", github: { issue: 5 } },
      ],
    };
    const body = formatEpicBody(input);
    expect(body).not.toContain("feat-cancelled");
    expect(body).toContain("feat-a");
    expect(body).toContain("feat-b");
  });

  test("preserves manifest array order in checklist", () => {
    const input: EpicBodyInput = {
      slug: "my-epic",
      phase: "implement",
      features: [
        { slug: "z-last", status: "pending" },
        { slug: "a-first", status: "pending" },
        { slug: "m-middle", status: "pending" },
      ],
    };
    const body = formatEpicBody(input);
    const zIdx = body.indexOf("z-last");
    const aIdx = body.indexOf("a-first");
    const mIdx = body.indexOf("m-middle");
    expect(zIdx).toBeLessThan(aIdx);
    expect(aIdx).toBeLessThan(mIdx);
  });

  test("no features section when features array is empty", () => {
    const input: EpicBodyInput = {
      slug: "empty",
      phase: "design",
      features: [],
    };
    const body = formatEpicBody(input);
    expect(body).not.toContain("## Features");
  });

  test("all features completed", () => {
    const input: EpicBodyInput = {
      slug: "done-epic",
      phase: "done",
      features: [
        { slug: "feat-1", status: "completed", github: { issue: 1 } },
        { slug: "feat-2", status: "completed", github: { issue: 2 } },
      ],
    };
    const body = formatEpicBody(input);
    expect(body).toContain("- [x] #1 feat-1");
    expect(body).toContain("- [x] #2 feat-2");
  });

  test("partial summary (only problem, no solution)", () => {
    const input: EpicBodyInput = {
      slug: "partial",
      phase: "design",
      summary: { problem: "Something wrong", solution: "" },
      features: [],
    };
    const body = formatEpicBody(input);
    expect(body).toContain("## Problem");
    expect(body).toContain("Something wrong");
    expect(body).not.toContain("## Solution");
  });

  test("fallback body with no summary but with features", () => {
    const input: EpicBodyInput = {
      slug: "no-summary",
      phase: "plan",
      features: [
        { slug: "feat-1", status: "pending", github: { issue: 5 } },
      ],
    };
    const body = formatEpicBody(input);
    expect(body).toContain("**Phase:** plan");
    expect(body).toContain("## Features");
    expect(body).toContain("- [ ] #5 feat-1");
  });
});

describe("formatFeatureBody", () => {
  test("includes description and epic back-reference", () => {
    const input: FeatureBodyInput = {
      slug: "my-feature",
      description: "This feature does stuff",
    };
    const body = formatFeatureBody(input, 42);
    expect(body).toContain("This feature does stuff");
    expect(body).toContain("**Epic:** #42");
  });

  test("falls back to slug heading when description is missing", () => {
    const input: FeatureBodyInput = {
      slug: "no-desc-feature",
    };
    const body = formatFeatureBody(input, 10);
    expect(body).toContain("## no-desc-feature");
    expect(body).toContain("**Epic:** #10");
  });

  test("falls back to slug heading when description is empty string", () => {
    const input: FeatureBodyInput = {
      slug: "empty-desc",
      description: "",
    };
    const body = formatFeatureBody(input, 5);
    expect(body).toContain("## empty-desc");
  });
});
