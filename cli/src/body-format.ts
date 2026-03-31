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
}

/** Minimal feature input — decoupled from full ManifestFeature. */
export interface FeatureBodyInput {
  slug: string;
  description?: string;
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

  // Problem/solution sections (only if summary exists)
  if (input.summary?.problem) {
    sections.push(`## Problem\n\n${input.summary.problem}`);
  }
  if (input.summary?.solution) {
    sections.push(`## Solution\n\n${input.summary.solution}`);
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

  sections.push(`**Epic:** #${epicNumber}`);

  return sections.join("\n\n");
}
