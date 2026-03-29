/**
 * Post-dispatch hook — runs after every phase dispatch to update the
 * manifest and sync state to GitHub.
 *
 * Stateless, post-only design: reads the phase output file from the
 * worktree, enriches the manifest, optionally advances the phase,
 * then mirrors state to GitHub via syncGitHub. Never throws — all
 * errors are caught and logged with a [post-dispatch] prefix.
 */

import type { Phase, PhaseOutput } from "./types";
import type { PipelineManifest } from "./manifest";
import { loadPhaseOutput, extractFeatureStatuses, extractArtifactPaths } from "./phase-output";
import { loadManifest, enrich, advancePhase, writeManifest } from "./manifest";
import { syncGitHub } from "./github-sync";
import { loadConfig } from "./config";

/** Maps each phase to its successor (release has no successor). */
const PHASE_SEQUENCE: Partial<Record<Phase, Phase>> = {
  design: "plan",
  plan: "implement",
  implement: "validate",
  validate: "release",
};

/** Options for the post-dispatch hook. */
export interface PostDispatchOptions {
  /** Path to the worktree where the phase ran */
  worktreePath: string;
  /** Project root (where pipeline/ lives) */
  projectRoot: string;
  /** Epic slug */
  epicSlug: string;
  /** Phase that was dispatched */
  phase: Phase;
  /** Feature slug (for implement fan-out) */
  featureSlug?: string;
  /** Whether the phase succeeded */
  success: boolean;
}

/**
 * Run post-dispatch processing: read phase output, enrich the manifest,
 * determine if the phase should advance, and sync state to GitHub.
 *
 * Never throws. All errors are caught and logged as warnings so a sync
 * failure never blocks the pipeline.
 */
export async function runPostDispatch(opts: PostDispatchOptions): Promise<void> {
  try {
    // Early exit on failure — no manifest/sync updates
    if (!opts.success) {
      console.log(`[post-dispatch] Phase ${opts.phase} failed for ${opts.epicSlug} — skipping updates`);
      return;
    }

    // Load phase output from the worktree
    const output = loadPhaseOutput(opts.worktreePath, opts.phase, opts.epicSlug);
    if (output) {
      console.log(`[post-dispatch] Loaded phase output for ${opts.phase}/${opts.epicSlug} (status: ${output.status})`);
    } else {
      console.log(`[post-dispatch] No phase output found for ${opts.phase}/${opts.epicSlug} — continuing without enrichment`);
    }

    // Load the manifest
    let manifest = loadManifest(opts.projectRoot, opts.epicSlug);
    if (!manifest) {
      console.log(`[post-dispatch] No manifest found for ${opts.epicSlug} — cannot update`);
      return;
    }
    console.log(`[post-dispatch] Loaded manifest for ${opts.epicSlug} (phase: ${manifest.phase})`);

    // Enrich manifest from phase output
    if (output) {
      const artifactPaths = extractArtifactPaths(output);
      const featureStatuses = extractFeatureStatuses(output);

      // Build enrichment payload
      const features = featureStatuses.length > 0
        ? featureStatuses.map((f) => ({
            slug: f.slug,
            plan: "",
            status: f.status as PipelineManifest["features"][number]["status"],
          }))
        : undefined;

      manifest = enrich(opts.projectRoot, opts.epicSlug, {
        phase: opts.phase,
        features,
        artifacts: artifactPaths.length > 0 ? artifactPaths : undefined,
      });
      console.log(`[post-dispatch] Enriched manifest (artifacts: ${artifactPaths.length}, features: ${featureStatuses.length})`);
    }

    // Handle implement fan-out: mark individual feature as completed
    if (opts.phase === "implement" && opts.featureSlug) {
      const feature = manifest.features.find((f) => f.slug === opts.featureSlug);
      if (feature) {
        feature.status = "completed";
        writeManifest(opts.projectRoot, opts.epicSlug, manifest);
        console.log(`[post-dispatch] Marked feature ${opts.featureSlug} as completed`);
      } else {
        console.log(`[post-dispatch] Feature ${opts.featureSlug} not found in manifest — skipping status update`);
      }
    }

    // Determine whether to advance the phase
    const nextPhase = shouldAdvance(opts.phase, output, manifest);
    if (nextPhase) {
      manifest = advancePhase(opts.projectRoot, opts.epicSlug, nextPhase);
      console.log(`[post-dispatch] Advanced phase: ${opts.phase} -> ${nextPhase}`);
    } else {
      console.log(`[post-dispatch] No phase advancement for ${opts.phase}`);
    }

    // Sync to GitHub — warn-and-continue
    try {
      const config = loadConfig(opts.projectRoot);
      await syncGitHub(manifest, config);
      console.log("[post-dispatch] GitHub sync complete");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`[post-dispatch] GitHub sync failed (non-blocking): ${message}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[post-dispatch] Unexpected error (non-blocking): ${message}`);
  }
}

/**
 * Determine whether the pipeline should advance to the next phase.
 *
 * Rules:
 * - design -> plan: always (output exists or not)
 * - plan -> implement: only if output has features
 * - implement -> validate: only if ALL features are completed
 * - validate -> release: only if output.status === "completed"
 * - release: no advancement
 *
 * Returns the next phase, or undefined if no advancement should occur.
 */
function shouldAdvance(
  phase: Phase,
  output: PhaseOutput | undefined,
  manifest: PipelineManifest,
): Phase | undefined {
  const nextPhase = PHASE_SEQUENCE[phase];
  if (!nextPhase) return undefined;

  switch (phase) {
    case "design":
      return nextPhase;

    case "plan": {
      if (!output) return undefined;
      const features = extractFeatureStatuses(output);
      return features.length > 0 ? nextPhase : undefined;
    }

    case "implement": {
      // All features must be completed
      if (manifest.features.length === 0) return undefined;
      const allCompleted = manifest.features.every((f) => f.status === "completed");
      return allCompleted ? nextPhase : undefined;
    }

    case "validate":
      return output?.status === "completed" ? nextPhase : undefined;

    default:
      return undefined;
  }
}
