/**
 * Builds a <commit-refs> block from the manifest's github field.
 *
 * Returns a multi-line string containing `Refs #N` lines for use in
 * checkpoint commit messages. Always includes the epic ref when
 * manifest.github exists. Adds the feature ref when featureSlug
 * is provided and that feature has a github.issue field.
 *
 * Returns empty string when manifest has no github field — a graceful no-op.
 */

import type { PipelineManifest } from "./manifest-store";

export function buildCommitRefs(
  manifest: PipelineManifest,
  featureSlug?: string,
): string {
  if (!manifest.github) return "";

  const refs: string[] = [`Refs #${manifest.github.epic}`];

  if (featureSlug) {
    const feature = manifest.features.find((f) => f.slug === featureSlug);
    if (feature?.github?.issue) {
      refs.push(`Refs #${feature.github.issue}`);
    }
  }

  return `\n<commit-refs>\n${refs.join("\n")}\n</commit-refs>`;
}
