/**
 * Watch command handler — entry point for `beastmode watch`.
 *
 * Wires the watch loop to the real state scanner, SDK dispatcher,
 * and run logger.
 */

import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { loadConfig } from "./config.js";
import { WatchLoop } from "./watch.js";
import type { WatchDeps } from "./watch.js";
import type { EpicState, SessionResult, NextAction, FeatureProgress } from "./watch-types.js";
import type { SessionStrategy } from "./session-strategy.js";
import { createSessionStrategy } from "./session-factory.js";
import { cmuxAvailable } from "./cmux-client.js";

/** Discover the project root (walks up to find .beastmode/). */
function findProjectRoot(from: string = process.cwd()): string {
  let dir = from;
  while (dir !== "/") {
    if (existsSync(resolve(dir, ".beastmode"))) return dir;
    dir = resolve(dir, "..");
  }
  throw new Error("Not inside a beastmode project (no .beastmode/ found)");
}

/** Scan manifests to determine epic states. Minimal inline scanner. */
async function scanEpics(projectRoot: string): Promise<EpicState[]> {
  // Dynamically import state-scanner if available, otherwise use inline logic
  try {
    const scanner = await import("./state-scanner.js");
    return scanner.scanEpics(projectRoot);
  } catch {
    // Fallback: inline manifest scanner
    return scanEpicsInline(projectRoot);
  }
}

/**
 * Pipeline state directory — gitignored, orchestrator-owned.
 * Contains manifests and phase markers. Never in a worktree.
 */
function pipelineDir(projectRoot: string): string {
  const dir = resolve(projectRoot, ".beastmode/pipeline");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Seed pipeline state from existing git-tracked manifests on first run.
 * Copies .beastmode/state/plan/*.manifest.json → .beastmode/pipeline/
 * Migrates validate/release state markers into manifest `phases` objects.
 */
function seedPipelineState(projectRoot: string): void {
  const dir = pipelineDir(projectRoot);

  // Seed manifests from git-tracked plan dir
  const planDir = resolve(projectRoot, ".beastmode/state/plan");
  if (existsSync(planDir)) {
    for (const f of readdirSync(planDir)) {
      if (f.endsWith(".manifest.json")) {
        const dest = resolve(dir, f);
        if (!existsSync(dest)) {
          copyFileSync(resolve(planDir, f), dest);
        }
      }
    }
  }

  // Migrate existing state dir markers into manifest phases
  for (const phase of ["validate", "release"] as const) {
    const phaseDir = resolve(projectRoot, ".beastmode/state", phase);
    if (!existsSync(phaseDir)) continue;
    for (const f of readdirSync(phaseDir)) {
      // Derive epic slug from marker filename: YYYY-MM-DD-<slug>.md
      const epicSlug = f.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
      const manifestFile = readdirSync(dir).find(
        (m) => m.endsWith(`-${epicSlug}.manifest.json`),
      );
      if (!manifestFile) continue;

      const manifestPath = resolve(dir, manifestFile);
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        if (!manifest.phases) manifest.phases = {};
        if (!manifest.phases[phase]) {
          manifest.phases[phase] = "completed";
          // If release is done, backfill all prior phases
          if (phase === "release") {
            manifest.phases.design ??= "completed";
            manifest.phases.plan ??= "completed";
            manifest.phases.implement ??= "completed";
            manifest.phases.validate ??= "completed";
          }
          if (phase === "validate") {
            manifest.phases.design ??= "completed";
            manifest.phases.plan ??= "completed";
            manifest.phases.implement ??= "completed";
          }
          writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        }
      } catch { /* skip unparseable */ }
    }
  }
}

/**
 * State reconciliation — the orchestrator is the sole writer of pipeline state.
 *
 * All runtime state lives in .beastmode/pipeline/ (gitignored).
 * Rules:
 *   plan      → scan worktree for feature plan .md files, build manifest
 *   implement → mark the completed feature in the manifest
 *   validate  → write validate marker
 *   release   → write release marker
 */
function reconcileState(opts: {
  worktreePath: string;
  projectRoot: string;
  epicSlug: string;
  phase: string;
  featureSlug?: string;
  success: boolean;
}): { completed: number; total: number } | undefined {
  if (!opts.success) return readProgress(opts.projectRoot, opts.epicSlug);

  switch (opts.phase) {
    case "plan":
      return reconcilePlan(opts.worktreePath, opts.projectRoot, opts.epicSlug);

    case "implement":
      if (opts.featureSlug) {
        return markFeatureCompleted(opts.projectRoot, opts.epicSlug, opts.featureSlug);
      }
      return readProgress(opts.projectRoot, opts.epicSlug);

    case "validate":
    case "release":
      updatePhaseStatus(opts.projectRoot, opts.epicSlug, opts.phase);
      return readProgress(opts.projectRoot, opts.epicSlug);

    default:
      return readProgress(opts.projectRoot, opts.epicSlug);
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * After plan completes, scan the worktree for feature plan .md files and
 * build the manifest in the pipeline dir.
 */
function reconcilePlan(
  worktreePath: string,
  projectRoot: string,
  epicSlug: string,
): { completed: number; total: number } | undefined {
  const planDir = resolve(worktreePath, ".beastmode/state/plan");
  if (!existsSync(planDir)) return;

  const featurePlanPattern = new RegExp(
    `^\\d{4}-\\d{2}-\\d{2}-${escapeRegExp(epicSlug)}-(.+)\\.md$`,
  );
  const planFiles = readdirSync(planDir).filter((f) => featurePlanPattern.test(f));
  if (planFiles.length === 0) return;

  const features = planFiles.map((f) => {
    const match = f.match(featurePlanPattern)!;
    return { slug: match[1], plan: f };
  });

  const dir = pipelineDir(projectRoot);

  // Read existing manifest to preserve statuses and metadata
  const manifestFile = readdirSync(dir).find(
    (f) => f.endsWith(`-${epicSlug}.manifest.json`),
  );
  let manifest: Record<string, unknown> = {};
  if (manifestFile) {
    try {
      manifest = JSON.parse(readFileSync(resolve(dir, manifestFile), "utf-8"));
    } catch { /* start fresh */ }
  }

  // Read worktree manifest for architectural decisions and github metadata
  const wtManifestFile = readdirSync(planDir).find(
    (f) => f.endsWith(`-${epicSlug}.manifest.json`),
  );
  if (wtManifestFile) {
    try {
      const wtManifest = JSON.parse(readFileSync(resolve(planDir, wtManifestFile), "utf-8"));
      if (wtManifest.architecturalDecisions?.length > 0) {
        manifest.architecturalDecisions = wtManifest.architecturalDecisions;
      }
      if (wtManifest.github) manifest.github = wtManifest.github;
      if (wtManifest.design) manifest.design = wtManifest.design;
    } catch { /* ignore */ }
  }

  // Preserve existing feature statuses
  const existingFeatures = (manifest.features ?? []) as Array<{ slug: string; status: string; github?: unknown }>;
  const statusMap = new Map(existingFeatures.map((f) => [f.slug, f]));

  manifest.features = features.map((f) => {
    const existing = statusMap.get(f.slug);
    return {
      slug: f.slug,
      plan: f.plan,
      status: existing?.status ?? "pending",
      ...(existing?.github ? { github: existing.github } : {}),
    };
  });
  manifest.lastUpdated = new Date().toISOString();

  // Plan completing implies design is done too
  if (!manifest.phases) manifest.phases = {};
  (manifest.phases as Record<string, string>).design = "completed";
  (manifest.phases as Record<string, string>).plan = "completed";

  // Write manifest to pipeline dir
  const manifestName = manifestFile ?? `${new Date().toISOString().slice(0, 10)}-${epicSlug}.manifest.json`;
  writeFileSync(resolve(dir, manifestName), JSON.stringify(manifest, null, 2));

  // Copy plan files to git-tracked state/plan/ for agents to read
  const destPlanDir = resolve(projectRoot, ".beastmode/state/plan");
  if (!existsSync(destPlanDir)) mkdirSync(destPlanDir, { recursive: true });
  const allPlanFiles = readdirSync(planDir).filter(
    (f) => f.includes(epicSlug) && !f.endsWith(".manifest.json"),
  );
  for (const file of allPlanFiles) {
    copyFileSync(resolve(planDir, file), resolve(destPlanDir, file));
  }

  const completed = (manifest.features as Array<{ status: string }>).filter(
    (f) => f.status === "completed",
  ).length;
  return { completed, total: features.length };
}

/** Update a phase status in the manifest's `phases` object. */
function updatePhaseStatus(
  projectRoot: string,
  epicSlug: string,
  phase: string,
): void {
  const dir = pipelineDir(projectRoot);
  const match = readdirSync(dir).find(
    (f) => f.endsWith(`-${epicSlug}.manifest.json`),
  );
  if (!match) return;

  const manifestPath = resolve(dir, match);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  if (!manifest.phases) manifest.phases = {};
  manifest.phases[phase] = "completed";
  manifest.lastUpdated = new Date().toISOString();

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

/** Mark a single feature as completed in the pipeline manifest. */
function markFeatureCompleted(
  projectRoot: string,
  epicSlug: string,
  featureSlug: string,
): { completed: number; total: number } | undefined {
  const dir = pipelineDir(projectRoot);

  const match = readdirSync(dir).find(
    (f) => f.endsWith(`-${epicSlug}.manifest.json`),
  );
  if (!match) return;

  const manifestPath = resolve(dir, match);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  const features: { slug: string; status: string }[] = manifest.features ?? [];
  const feature = features.find((f) => f.slug === featureSlug);
  if (!feature) return;

  feature.status = "completed";
  manifest.lastUpdated = new Date().toISOString();

  const completed = features.filter((f) => f.status === "completed").length;

  // If all features done, mark implement phase completed
  if (completed === features.length) {
    if (!manifest.phases) manifest.phases = {};
    (manifest.phases as Record<string, string>).implement = "completed";
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  return { completed, total: features.length };
}

/** Read feature progress from the pipeline manifest. */
function readProgress(
  projectRoot: string,
  epicSlug: string,
): { completed: number; total: number } | undefined {
  const dir = pipelineDir(projectRoot);

  const match = readdirSync(dir).find(
    (f) => f.endsWith(`-${epicSlug}.manifest.json`),
  );
  if (!match) return;

  try {
    const manifest = JSON.parse(readFileSync(resolve(dir, match), "utf-8"));
    const features: { status: string }[] = manifest.features ?? [];
    if (features.length === 0) return;
    const completed = features.filter((f) => f.status === "completed").length;
    return { completed, total: features.length };
  } catch {
    return;
  }
}

/** Inline epic scanner — reads manifests from pipeline dir (fallback to state/plan/). */
function scanEpicsInline(projectRoot: string): EpicState[] {
  const pipeDir = pipelineDir(projectRoot);
  const planDir = resolve(projectRoot, ".beastmode", "state", "plan");

  // Prefer pipeline dir manifests, fall back to plan dir
  const manifestDir = readdirSync(pipeDir).some(f => f.endsWith(".manifest.json"))
    ? pipeDir
    : planDir;
  if (!existsSync(manifestDir)) return [];

  const files = readdirSync(manifestDir).filter((f: string) =>
    f.endsWith(".manifest.json"),
  );

  const epics: EpicState[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(resolve(manifestDir, file), "utf-8");
      const manifest = JSON.parse(content);

      // Derive slug from filename: YYYY-MM-DD-<slug>.manifest.json
      const slug = file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(".manifest.json", "");

      const features: FeatureProgress[] = (manifest.features ?? []).map(
        (f: { slug: string; status: string }) => ({
          slug: f.slug,
          status: f.status as FeatureProgress["status"],
        }),
      );

      const allCompleted = features.length > 0 && features.every((f) => f.status === "completed");
      const pendingFeatures = features.filter((f) => f.status === "pending");
      const hasDesign = existsSync(resolve(projectRoot, manifest.design ?? ""));
      const phases: Record<string, string> = manifest.phases ?? {};

      let phase: string;
      let nextAction: NextAction | null = null;
      let gateBlocked = false;

      if (phases.release === "completed") {
        // Epic is done
        phase = "release";
        nextAction = null;
      } else if (phases.validate === "completed") {
        // Validated — ready for release
        phase = "validate";
        nextAction = { phase: "release", args: [slug], type: "single" };
      } else if (allCompleted) {
        // All features done — needs validate
        phase = "implement";
        nextAction = { phase: "validate", args: [slug], type: "single" };
      } else if (features.length === 0 && hasDesign) {
        // Design exists but no features planned yet
        phase = "design";
        nextAction = { phase: "plan", args: [slug], type: "single" };
      } else if (pendingFeatures.length > 0) {
        // Has pending features — implement fan-out
        phase = "implement";
        nextAction = {
          phase: "implement",
          args: [slug],
          type: "fan-out",
          features: pendingFeatures.map((f) => f.slug),
        };
      } else {
        // In progress or blocked
        phase = "implement";
        nextAction = null;
      }

      // Check for human gates in config
      const config = loadConfig(projectRoot);
      const gateConfig = config.gates?.implement;
      if (gateConfig) {
        for (const [_gate, mode] of Object.entries(gateConfig)) {
          if (mode === "human") {
            // Check if any feature has a blocked status indicating gate hit
            const blocked = features.some((f) => f.status === "blocked" as string);
            if (blocked) {
              gateBlocked = true;
              break;
            }
          }
        }
      }

      // Aggregate cost from .beastmode-runs.json
      let costUsd = 0;
      const runsPath = resolve(projectRoot, ".beastmode-runs.json");
      if (existsSync(runsPath)) {
        try {
          const runs = JSON.parse(readFileSync(runsPath, "utf-8")) as Array<{
            epic: string;
            cost_usd: number;
          }>;
          costUsd = runs
            .filter((r) => r.epic === slug)
            .reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
        } catch {
          // Corrupted runs file — ignore
        }
      }

      epics.push({
        slug,
        phase,
        nextAction,
        features,
        gateBlocked,
        costUsd,
      });
    } catch {
      // Skip unparseable manifests
    }
  }

  return epics;
}

/** Dispatch a phase using the session strategy (SdkStrategy by default). */
async function dispatchPhase(
  strategy: SessionStrategy,
  opts: {
    epicSlug: string;
    phase: string;
    args: string[];
    featureSlug?: string;
    projectRoot: string;
    signal: AbortSignal;
  },
): Promise<{
  id: string;
  worktreeSlug: string;
  promise: Promise<SessionResult>;
}> {
  const handle = await strategy.dispatch(opts);

  // After the agent exits, reconcile state on the project root
  const syncedPromise = handle.promise.then(async (result) => {
    const worktreeSlug = handle.worktreeSlug;
    const worktreePath = resolve(
      opts.projectRoot,
      ".claude/worktrees",
      worktreeSlug,
    );
    const progress = reconcileState({
      worktreePath,
      projectRoot: opts.projectRoot,
      epicSlug: opts.epicSlug,
      phase: opts.phase,
      featureSlug: opts.featureSlug,
      success: result.success,
    });

    // Clean up strategy resources (e.g. cmux workspace/surfaces) after successful release
    if (opts.phase === "release" && result.success) {
      try {
        await strategy.cleanup(opts.epicSlug);
      } catch (err) {
        console.warn(`[watch] ${opts.epicSlug}: strategy cleanup failed (continuing):`, err);
      }
    }

    return { ...result, progress };
  });

  return {
    id: handle.id,
    worktreeSlug: handle.worktreeSlug,
    promise: syncedPromise,
  };
}

/** Append a run entry to .beastmode-runs.json. */
async function logRun(opts: {
  epicSlug: string;
  phase: string;
  featureSlug?: string;
  result: SessionResult;
  projectRoot: string;
}): Promise<void> {
  const runsPath = resolve(opts.projectRoot, ".beastmode-runs.json");

  let runs: unknown[] = [];
  if (existsSync(runsPath)) {
    try {
      runs = JSON.parse(readFileSync(runsPath, "utf-8"));
    } catch {
      runs = [];
    }
  }

  runs.push({
    epic: opts.epicSlug,
    phase: opts.phase,
    feature: opts.featureSlug ?? null,
    cost_usd: opts.result.costUsd,
    duration_ms: opts.result.durationMs,
    exit_status: opts.result.exitCode,
    timestamp: new Date().toISOString(),
  });

  // Ensure directory exists
  const dir = resolve(opts.projectRoot);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(runsPath, JSON.stringify(runs, null, 2));
}

/** Main entry point for `beastmode watch`. */
export async function watchCommand(_args: string[]): Promise<void> {
  const projectRoot = findProjectRoot();
  const config = loadConfig(projectRoot);

  // Bootstrap pipeline state from git-tracked manifests on first run
  seedPipelineState(projectRoot);

  // Create session strategy from config (with real cmux availability check)
  const strategy = await createSessionStrategy({
    strategy: config.cli["dispatch-strategy"] ?? "sdk",
    isCmuxAvailable: cmuxAvailable,
  });

  const deps: WatchDeps = {
    scanEpics,
    dispatchPhase: (opts) => dispatchPhase(strategy, opts),
    logRun,
  };

  const loop = new WatchLoop(
    {
      intervalSeconds: config.cli.interval ?? 60,
      projectRoot,
    },
    deps,
  );

  await loop.start();
}
