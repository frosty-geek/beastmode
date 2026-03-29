import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, basename } from "path";
import type { Phase } from "./types";

/** Feature-level progress within an epic */
export interface FeatureProgress {
  slug: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  githubIssue?: number;
}

/** A dispatchable action derived from epic state */
export interface NextAction {
  phase: string;
  args: string[];
  type: "single" | "fan-out";
  features?: string[];
}

/** Structured state for a single epic */
export interface EpicState {
  slug: string;
  designPath: string;
  manifestPath?: string;
  phase: Phase;
  nextAction: NextAction | null;
  features: FeatureProgress[];
  blocked: boolean;
  blockedGate?: string;
  gateBlocked: boolean;
  gateName?: string;
  githubEpicIssue?: number;
}

/** Manifest JSON structure as written by /plan */
interface Manifest {
  design: string;
  architecturalDecisions: Array<{ decision: string; choice: string }>;
  features: Array<{
    slug: string;
    plan: string;
    status: string;
    github?: { issue: number };
  }>;
  phase?: Phase;
  github?: {
    epic: number;
    repo: string;
  };
  lastUpdated: string;
}

/**
 * Extract epic slug from a design artifact filename.
 * Input: "2026-03-28-typescript-pipeline-orchestrator.md"
 * Output: "typescript-pipeline-orchestrator"
 */
export function slugFromDesign(filename: string): string {
  return basename(filename, ".md").replace(/^\d{4}-\d{2}-\d{2}-/, "");
}


/**
 * Find the manifest for a given design slug.
 * Checks .beastmode/pipeline/ first (orchestrator runtime state),
 * falls back to .beastmode/state/plan/ (git-tracked seed data).
 */
function findManifest(pipeDir: string, planDir: string, slug: string): string | undefined {
  for (const dir of [pipeDir, planDir]) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir);
    const matches = files
      .filter((f) => f.endsWith(`-${slug}.manifest.json`))
      .sort();
    if (matches.length > 0) return resolve(dir, matches[matches.length - 1]);
  }
  return undefined;
}

/**
 * Detect and resolve git merge conflict markers in raw file content.
 * Uses an "ours-side" strategy: keeps content before ======= in each
 * conflict block, discards theirs. Returns the original string unchanged
 * if no conflict markers are present.
 */
export function resolveConflicts(raw: string): string {
  if (!raw.includes("<<<<<<<")) return raw;

  const lines = raw.split("\n");
  const result: string[] = [];
  let inConflict = false;
  let inTheirs = false;

  for (const line of lines) {
    if (line.startsWith("<<<<<<<")) {
      inConflict = true;
      inTheirs = false;
      continue;
    }
    if (inConflict && line.startsWith("=======")) {
      inTheirs = true;
      continue;
    }
    if (line.startsWith(">>>>>>>")) {
      inConflict = false;
      inTheirs = false;
      continue;
    }
    if (!inTheirs) {
      result.push(line);
    }
  }

  return result.join("\n");
}

/**
 * Read and parse a manifest file. Returns undefined on any error.
 * Automatically resolves git merge conflict markers before parsing.
 */
function readManifest(path: string): Manifest | undefined {
  try {
    const raw = readFileSync(path, "utf-8");
    if (!raw.trim()) {
      console.warn(`[scanner] Skipping empty manifest: ${path}`);
      return undefined;
    }
    const resolved = resolveConflicts(raw);
    if (resolved !== raw) {
      console.warn(`[scanner] Auto-resolved merge conflicts in ${path}`);
    }
    return JSON.parse(resolved) as Manifest;
  } catch {
    console.warn(`[scanner] Skipping unparseable manifest: ${path}`);
    return undefined;
  }
}


/**
 * Derive phase from manifest state.
 * Primary: manifest.phase field (set by reconciler).
 * Fallback: structural inference for pre-migration manifests.
 */
function derivePhase(
  manifest: Manifest | undefined,
): { phase: Phase; done: boolean } {
  if (!manifest) {
    return { phase: "design", done: false };
  }

  // Primary path: read manifest.phase directly
  if (manifest.phase) {
    const done = manifest.phase === "released";
    return { phase: manifest.phase, done };
  }

  // Fallback: structural inference for pre-migration manifests
  if (!manifest.features || manifest.features.length === 0) {
    return { phase: "plan", done: false };
  }

  const allCompleted = manifest.features.every((f) => f.status === "completed");
  if (allCompleted) {
    return { phase: "validate", done: false };
  }

  return { phase: "implement", done: false };
}


/**
 * Derive the next action for an epic given its phase and manifest state.
 */
function deriveNextAction(
  slug: string,
  phase: Phase,
  manifest: Manifest | undefined,
): NextAction | null {
  switch (phase) {
    case "design":
      // Design exists but no manifest — needs plan
      return { phase: "plan", args: [slug], type: "single" };

    case "plan":
      // Manifest exists but no features — needs plan (re-run or first run)
      return { phase: "plan", args: [slug], type: "single" };

    case "implement": {
      if (!manifest) return null;
      const pendingFeatures = manifest.features
        .filter((f) => f.status === "pending" || f.status === "in-progress")
        .map((f) => f.slug);
      if (pendingFeatures.length === 0) return null;
      return {
        phase: "implement",
        args: [slug],
        type: "fan-out",
        features: pendingFeatures,
      };
    }

    case "validate":
      return { phase: "validate", args: [slug], type: "single" };

    case "release":
      return { phase: "release", args: [slug], type: "single" };

    case "released":
      return null;

    default:
      return null;
  }
}

/**
 * Check if an epic is blocked on a human gate.
 * Reactive strategy: only check for blocked features, no preemptive config checking.
 */
function checkGateBlocked(
  manifest: Manifest | undefined,
): { blocked: boolean; gateName?: string } {
  if (manifest?.features.some((f) => f.status === "blocked")) {
    return { blocked: true, gateName: "feature-blocked" };
  }
  return { blocked: false };
}

/**
 * Extract feature progress from a manifest.
 */
function extractFeatures(manifest: Manifest | undefined): FeatureProgress[] {
  if (!manifest?.features) return [];
  return manifest.features.map((f) => ({
    slug: f.slug,
    status: f.status as FeatureProgress["status"],
    githubIssue: f.github?.issue,
  }));
}

/**
 * Deduplicate manifest entries by slug. When multiple design files resolve
 * to the same slug, the newest (last sorted by filename) wins. Collisions
 * are warned to stderr so operators notice in watch loop output.
 */
function deduplicateManifests(
  entries: Array<{ slug: string; manifestPath?: string; designFile: string }>,
): Array<{ slug: string; manifestPath?: string; designFile: string }> {
  const bySlug = new Map<string, typeof entries>();
  for (const entry of entries) {
    const existing = bySlug.get(entry.slug) ?? [];
    existing.push(entry);
    bySlug.set(entry.slug, existing);
  }

  const result: typeof entries = [];
  for (const [slug, group] of bySlug) {
    if (group.length > 1) {
      // Sort by designFile name — last wins (newest date)
      group.sort((a, b) => a.designFile.localeCompare(b.designFile));
      const winner = group[group.length - 1];
      const losers = group.slice(0, -1);
      console.warn(
        `[scanner] Slug collision "${slug}": ${losers.map((l) => l.designFile).join(", ")} shadowed by ${winner.designFile}`,
      );
      result.push(winner);
    } else {
      result.push(group[0]);
    }
  }
  return result;
}

/**
 * Scan all epics in the project and return their structured state.
 * Pure read-only operation — no filesystem writes or process spawns.
 */
export async function scanEpics(projectRoot: string): Promise<EpicState[]> {
  const stateDir = resolve(projectRoot, ".beastmode", "state");
  const designDir = resolve(stateDir, "design");
  const planDir = resolve(stateDir, "plan");
  const pipeDir = resolve(projectRoot, ".beastmode", "pipeline");

  if (!existsSync(designDir)) return [];

  const designFiles = readdirSync(designDir).filter((f) => f.endsWith(".md"));
  const epics: EpicState[] = [];

  // Build entries and deduplicate by slug before processing
  const entries = designFiles.map((f) => ({
    slug: slugFromDesign(f),
    manifestPath: findManifest(pipeDir, planDir, slugFromDesign(f)),
    designFile: f,
  }));
  const deduplicated = deduplicateManifests(entries);

  for (const { slug, manifestPath: mPath, designFile } of deduplicated) {
    try {
      const designPath = resolve(designDir, designFile);
      const manifestPath = mPath;
      const manifest = manifestPath ? readManifest(manifestPath) : undefined;

      const { phase, done } = derivePhase(manifest);
      const nextAction = done ? null : deriveNextAction(slug, phase, manifest);
      const { blocked, gateName } = checkGateBlocked(manifest);
      const features = extractFeatures(manifest);
      const githubEpicIssue = manifest?.github?.epic;

      epics.push({
        slug,
        designPath,
        manifestPath,
        phase,
        nextAction,
        features,
        blocked,
        blockedGate: gateName,
        gateBlocked: blocked,
        gateName,
        githubEpicIssue,
      });
    } catch (err) {
      console.warn(`[scanner] Error processing ${designFile}, skipping: ${err}`);
      continue;
    }
  }

  return epics;
}
