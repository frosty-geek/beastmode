/**
 * Manifest reader — typed access to plan manifests.
 *
 * Used by run command (implement fan-out) and watch loop.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve } from "path";

export interface ManifestFeature {
  slug: string;
  plan: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  github?: { issue: number };
}

export interface ManifestGitHub {
  epic: number;
  repo: string;
}

export interface Manifest {
  design: string;
  architecturalDecisions: Array<{ decision: string; choice: string }>;
  features: ManifestFeature[];
  github?: ManifestGitHub;
  lastUpdated: string;
}

/**
 * Find the manifest file for a given design slug.
 * Convention: .beastmode/state/plan/*-<slug>.manifest.json
 */
export function findManifestPath(
  projectRoot: string,
  designSlug: string,
): string | undefined {
  const planDir = resolve(projectRoot, ".beastmode", "state", "plan");
  if (!existsSync(planDir)) return undefined;

  const files = readdirSync(planDir);
  const matches = files
    .filter((f) => f.endsWith(`-${designSlug}.manifest.json`))
    .sort();

  if (matches.length === 0) return undefined;
  return resolve(planDir, matches[matches.length - 1]);
}

/**
 * Read and parse a manifest file. Throws on missing/corrupt file.
 */
export function readManifest(path: string): Manifest {
  if (!existsSync(path)) {
    throw new Error(`Manifest not found: ${path}`);
  }
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Manifest;
}

/**
 * Find and read the manifest for a design slug.
 * Returns undefined if no manifest exists.
 */
export function loadManifest(
  projectRoot: string,
  designSlug: string,
): Manifest | undefined {
  const path = findManifestPath(projectRoot, designSlug);
  if (!path) return undefined;
  try {
    return readManifest(path);
  } catch {
    return undefined;
  }
}

/**
 * Get pending/in-progress features from a manifest.
 */
export function getPendingFeatures(manifest: Manifest): ManifestFeature[] {
  return manifest.features.filter(
    (f) => f.status === "pending" || f.status === "in-progress",
  );
}
