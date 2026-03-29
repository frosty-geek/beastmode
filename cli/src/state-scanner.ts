import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, basename } from "path";
import type { Phase, RunLogEntry } from "./types";
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
  designPath: string;
  manifestPath?: string;
  phase: Phase;
  nextAction: NextAction | null;
  features: FeatureProgress[];
  blocked: boolean;
  blockedGate?: string;
  gateBlocked: boolean;
  gateName?: string;
  costUsd: number;
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
  github?: {
    epic: number;
    repo: string;
  };
  lastUpdated: string;
}

/**
 * Validate manifest structural integrity.
 * Required: design (string), features (array of objects with slug+status strings), lastUpdated (string).
 */
function validateManifest(data: unknown): data is Manifest {
  if (data === null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.design !== "string") return false;
  if (typeof obj.lastUpdated !== "string") return false;
  if (!Array.isArray(obj.features)) return false;
  for (const f of obj.features) {
    if (f === null || typeof f !== "object") return false;
    const feat = f as Record<string, unknown>;
    if (typeof feat.slug !== "string") return false;
    if (typeof feat.status !== "string") return false;
  }
  return true;
}

/**
 * Validate output.json schema.
 * Required: status (string) and artifacts (object).
 */
function validateOutputJson(data: unknown): boolean {
  if (data === null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.status !== "string") return false;
  if (obj.artifacts === null || typeof obj.artifacts !== "object" || Array.isArray(obj.artifacts)) return false;
  return true;
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
 * Checks .beastmode/pipeline/ only (orchestrator runtime state).
 */
function findManifest(pipeDir: string, slug: string): string | undefined {
  if (!existsSync(pipeDir)) return undefined;
  const files = readdirSync(pipeDir);
  const matches = files
    .filter((f) => f.endsWith(`-${slug}.manifest.json`))
    .sort();
  if (matches.length > 0) return resolve(pipeDir, matches[matches.length - 1]);
  return undefined;
}

/**
 * Read and parse a manifest file. Returns undefined on any error.
 */
function readManifest(path: string): Manifest | undefined {
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (!validateManifest(parsed)) {
      console.warn(`[beastmode] Skipping malformed manifest: ${path}`);
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * Read and parse the run log. Returns empty array on any error.
 */
function readRunLog(projectRoot: string): RunLogEntry[] {
  const logPath = resolve(projectRoot, ".beastmode-runs.json");
  if (!existsSync(logPath)) return [];
  try {
    const raw = readFileSync(logPath, "utf-8").trim();
    if (!raw) return [];
    return JSON.parse(raw) as RunLogEntry[];
  } catch {
    return [];
  }
}

/**
 * Aggregate cost for a given epic slug from the run log.
 */
function aggregateCost(entries: RunLogEntry[], epicSlug: string): number {
  return entries
    .filter((e) => e.epic === epicSlug)
    .reduce((sum, e) => sum + (e.cost_usd ?? 0), 0);
}

/**
 * Check for an output.json checkpoint file in state/<phase>/.
 * Looks for files matching *-<slug>.output.json.
 */
function hasOutputJson(stateDir: string, phase: string, slug: string): boolean {
  const dir = resolve(stateDir, phase);
  if (!existsSync(dir)) return false;
  const match = readdirSync(dir).find(
    (f) => f.endsWith(`-${slug}.output.json`),
  );
  if (!match) return false;
  try {
    const raw = readFileSync(resolve(dir, match), "utf-8");
    const parsed = JSON.parse(raw);
    if (!validateOutputJson(parsed)) {
      console.warn(`[beastmode] Skipping malformed output.json: ${resolve(dir, match)}`);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Derive the current phase from output.json checkpoint files.
 * Waterfall: release output.json → validate output.json →
 * all features completed → implement → plan → design
 */
function derivePhase(
  slug: string,
  manifest: Manifest | undefined,
  stateDir: string,
): { phase: Phase; done: boolean } {
  // Check output.json checkpoints (highest phase wins)
  if (hasOutputJson(stateDir, "release", slug)) {
    return { phase: "release", done: true };
  }
  if (hasOutputJson(stateDir, "validate", slug)) {
    return { phase: "release", done: false };
  }

  if (!manifest) {
    return { phase: "design", done: false };
  }

  if (!manifest.features || manifest.features.length === 0) {
    return { phase: "plan", done: false };
  }

  const allCompleted = manifest.features.every(
    (f) => f.status === "completed",
  );

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
  // Check for blocked features in manifest
  if (manifest?.features.some((f) => f.status === "blocked")) {
    return { blocked: true, gateName: "feature-blocked" };
  }

  // Check if the current phase has human gates that would block auto-dispatch
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
 * Pure read-only operation — no filesystem writes or process spawns.
 */
export async function scanEpics(projectRoot: string): Promise<EpicState[]> {
  const stateDir = resolve(projectRoot, ".beastmode", "state");
  const designDir = resolve(stateDir, "design");
  const pipeDir = resolve(projectRoot, ".beastmode", "pipeline");

  if (!existsSync(designDir)) return [];

  const designFiles = readdirSync(designDir).filter((f) => f.endsWith(".md"));
  const runLog = readRunLog(projectRoot);
  const epics: EpicState[] = [];

  for (const designFile of designFiles) {
    const slug = slugFromDesign(designFile);
    const designPath = resolve(designDir, designFile);

    const manifestPath = findManifest(pipeDir, slug);
    const manifest = manifestPath ? readManifest(manifestPath) : undefined;

    const { phase, done } = derivePhase(slug, manifest, stateDir);
    const nextAction = done ? null : deriveNextAction(slug, phase, manifest);
    const { blocked, gateName } = checkGateBlocked(phase, manifest, projectRoot);
    const features = extractFeatures(manifest);
    const costUsd = aggregateCost(runLog, slug);
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
      costUsd,
      githubEpicIssue,
    });
  }

  return epics;
}
