import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, basename } from "path";
import type { Phase } from "./types";
import { loadConfig } from "./config";

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
  designPath?: string;
  manifestPath?: string;
  phase: Phase;
  nextAction: NextAction | null;
  features: FeatureProgress[];
  blocked: boolean;
  blockedGate?: string;
  gateBlocked: boolean;
  gateName?: string;
  githubEpicIssue?: number;
  lastUpdated?: string;
}

/** Manifest JSON structure — supports both legacy and new pipeline format */
interface Manifest {
  slug?: string;
  design?: string;
  architecturalDecisions?: Array<{ decision: string; choice: string }>;
  phase?: string;
  phases?: Record<string, string>;
  features: Array<{
    slug: string;
    plan: string;
    status: string;
    github?: { issue: number };
  }>;
  github?: {
    epic: number;
    repo: string;
  };
  lastUpdated: string;
}

/**
 * Extract slug from a dated filename.
 * Input: "2026-03-28-typescript-pipeline-orchestrator.md"
 * Output: "typescript-pipeline-orchestrator"
 */
export function slugFromFilename(filename: string): string {
  return basename(filename, ".md").replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

/**
 * @deprecated Use slugFromFilename instead. Kept for backward compatibility.
 */
export const slugFromDesign = slugFromFilename;

/**
 * Read and parse a manifest file. Returns undefined on any error.
 */
function readManifest(path: string): Manifest | undefined {
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return undefined;
  }
}

/**
 * Derive the current phase from manifest state.
 * - Release phase completed in manifest → done
 * - No features → plan
 * - All features completed + validate completed → release
 * - All features completed → validate
 * - Otherwise → implement
 */
function derivePhase(
  manifest: Manifest,
): { phase: Phase; done: boolean } {
  if (manifest.phases?.["release"] === "completed") {
    return { phase: "release", done: true };
  }

  if (!manifest.features || manifest.features.length === 0) {
    return { phase: "plan", done: false };
  }

  const allCompleted = manifest.features.every((f) => f.status === "completed");

  if (allCompleted) {
    if (manifest.phases?.["validate"] === "completed") {
      return { phase: "release", done: false };
    }
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
    case "plan":
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

    default:
      return null;
  }
}

/**
 * Check if an epic is blocked on a human gate.
 * Looks for features with status "blocked" or checks config for human gates
 * on the current phase.
 */
function checkGateBlocked(
  phase: Phase,
  manifest: Manifest | undefined,
  projectRoot: string,
): { blocked: boolean; gateName?: string } {
  if (manifest?.features.some((f) => f.status === "blocked")) {
    return { blocked: true, gateName: "feature-blocked" };
  }

  const config = loadConfig(projectRoot);
  const phaseGates = config.gates[phase as keyof typeof config.gates];
  if (phaseGates) {
    for (const [gate, mode] of Object.entries(phaseGates)) {
      if (mode === "human") {
        return { blocked: true, gateName: `${phase}.${gate}` };
      }
    }
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
 * Scan all epics in the project and return their structured state.
 * Discovery pivots on manifest files — pipeline/ wins dedup over plan/.
 * Pure read-only operation — no filesystem writes or process spawns.
 */
export async function scanEpics(projectRoot: string): Promise<EpicState[]> {
  const stateDir = resolve(projectRoot, ".beastmode", "state");
  const planDir = resolve(stateDir, "plan");
  const pipeDir = resolve(projectRoot, ".beastmode", "pipeline");

  // Collect manifests: slug -> path
  // Pipeline wins dedup over plan
  const manifestMap = new Map<string, string>();

  // Scan plan dir first (lower priority)
  if (existsSync(planDir)) {
    for (const f of readdirSync(planDir)) {
      if (!f.endsWith(".manifest.json")) continue;
      const slug = f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(".manifest.json", "");
      manifestMap.set(slug, resolve(planDir, f));
    }
  }

  // Scan pipeline dir — nested slug dirs (higher priority, overwrites plan entries)
  if (existsSync(pipeDir)) {
    for (const entry of readdirSync(pipeDir)) {
      const nestedManifest = resolve(pipeDir, entry, "manifest.json");
      if (existsSync(nestedManifest)) {
        manifestMap.set(entry, nestedManifest);
        continue;
      }
      // Flat file in pipeline dir
      if (entry.endsWith(".manifest.json")) {
        const slug = entry.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(".manifest.json", "");
        manifestMap.set(slug, resolve(pipeDir, entry));
      }
    }
  }

  const epics: EpicState[] = [];

  for (const [slug, manifestPath] of manifestMap) {
    const manifest = readManifest(manifestPath);
    if (!manifest) continue;

    const { phase, done } = derivePhase(manifest);
    const nextAction = done ? null : deriveNextAction(slug, phase, manifest);
    const { blocked, gateName } = checkGateBlocked(phase, manifest, projectRoot);
    const features = extractFeatures(manifest);
    const githubEpicIssue = manifest.github?.epic;
    const designPath = manifest.design;
    const lastUpdated = manifest.lastUpdated;

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
      lastUpdated,
    });
  }

  return epics;
}
