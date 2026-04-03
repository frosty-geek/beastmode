/**
 * Body formatting for GitHub issue bodies — pure functions, no I/O.
 *
 * Renders markdown issue bodies from manifest state.
 * Epic body: phase badge, problem/solution, feature checklist.
 * Feature body: description, epic back-reference.
 */

import type { Phase } from "./types.js";

/** Minimal epic input — decoupled from full PipelineManifest to stay pure. */
export interface EpicBodyInput {
  slug: string;
  phase: Phase;
  summary?: { problem: string; solution: string };
  features: Array<{
    slug: string;
    status: "pending" | "in-progress" | "completed" | "blocked" | "cancelled";
    github?: { issue: number };
  }>;
  /** PRD sections extracted from design artifact. */
  prdSections?: {
    problem?: string;
    solution?: string;
    userStories?: string;
    decisions?: string;
  };
  /** Artifact links per phase — repo path + optional permalink. */
  artifactLinks?: Record<string, { repoPath: string; permalink?: string }>;
}

/** Minimal feature input — decoupled from full ManifestFeature. */
export interface FeatureBodyInput {
  slug: string;
  description?: string;
  /** User story text extracted from the feature plan. */
  userStory?: string;
}

/**
 * Format an epic issue body from manifest state.
 *
 * Includes: phase badge, problem statement, solution summary, feature checklist.
 * Cancelled features are excluded. Unlinked features show plain text.
 * Missing summary fields produce a graceful fallback.
 */
export function formatEpicBody(input: EpicBodyInput): string {
  const sections: string[] = [];

  // Phase badge
  sections.push(`**Phase:** ${input.phase}`);

  // Problem/solution — prdSections override summary when present
  const problem = input.prdSections?.problem ?? input.summary?.problem;
  if (problem) {
    sections.push(`## Problem\n\n${problem}`);
  }
  const solution = input.prdSections?.solution ?? input.summary?.solution;
  if (solution) {
    sections.push(`## Solution\n\n${solution}`);
  }

  // PRD user stories and decisions (only from prdSections)
  if (input.prdSections?.userStories) {
    sections.push(`## User Stories\n\n${input.prdSections.userStories}`);
  }
  if (input.prdSections?.decisions) {
    sections.push(`## Decisions\n\n${input.prdSections.decisions}`);
  }

  // Artifact links table
  if (input.artifactLinks) {
    const entries = Object.entries(input.artifactLinks);
    if (entries.length > 0) {
      const rows = entries.map(([phase, { repoPath, permalink }]) => {
        const link = permalink ? `[${repoPath}](${permalink})` : repoPath;
        return `| ${phase} | ${link} |`;
      });
      sections.push(
        `## Artifacts\n\n| Phase | Link |\n|-------|------|\n${rows.join("\n")}`,
      );
    }
  }

  // Feature checklist — exclude cancelled
  const activeFeatures = input.features.filter(
    (f) => f.status !== "cancelled",
  );
  if (activeFeatures.length > 0) {
    const lines = activeFeatures.map((f) => {
      const checked = f.status === "completed" ? "x" : " ";
      const ref = f.github?.issue ? `#${f.github.issue}` : f.slug;
      return `- [${checked}] ${ref} ${f.slug}`;
    });
    sections.push(`## Features\n\n${lines.join("\n")}`);
  }

  return sections.join("\n\n");
}

/**
 * Format a feature issue body from manifest state.
 *
 * Includes: description text, epic back-reference.
 * Missing description falls back to slug + epic reference.
 */
export function formatFeatureBody(
  input: FeatureBodyInput,
  epicNumber: number,
): string {
  const sections: string[] = [];

  if (input.description) {
    sections.push(input.description);
  } else {
    sections.push(`## ${input.slug}`);
  }

  // User story (optional, from feature plan)
  if (input.userStory) {
    sections.push(`## User Story\n\n${input.userStory}`);
  }

  sections.push(`**Epic:** #${epicNumber}`);

  return sections.join("\n\n");
}
