/**
 * Artifact Reader — resolves, reads, and splits artifact files from disk.
 *
 * Three pure-ish utilities:
 * 1. splitSections — splits markdown on ## headings into a Map
 * 2. resolveArtifactPath — finds an artifact file via manifest or glob scan
 * 3. readArtifactSections — orchestrates resolve + read + split
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, relative } from "path";
import type { Logger } from "./logger.js";

/**
 * Split markdown content into sections by `## ` headings.
 *
 * - Strips YAML frontmatter (between `---` markers at start) before splitting.
 * - Content before the first heading is stored under key `""` (empty string).
 * - Heading names are case-sensitive, trimmed of leading/trailing whitespace.
 * - Empty sections (heading immediately followed by another heading) map to `""`.
 * - Only splits on `## ` (two hashes + space), not `# ` or `### `.
 *
 * @param markdown - Raw markdown string
 * @returns Map of heading name -> section body (both trimmed)
 */
export function splitSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();

  // Strip YAML frontmatter if present
  let content = markdown;
  if (content.startsWith("---")) {
    const endIdx = content.indexOf("---", 3);
    if (endIdx !== -1) {
      content = content.slice(endIdx + 3);
    }
  }

  const lines = content.split("\n");
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      // Flush previous section
      if (currentHeading !== "" || currentBody.length > 0) {
        sections.set(currentHeading, currentBody.join("\n").trim());
      }
      currentHeading = line.slice(3).trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  // Flush last section
  if (currentHeading !== "" || currentBody.length > 0) {
    sections.set(currentHeading, currentBody.join("\n").trim());
  }

  return sections;
}

/**
 * Resolve the path to an artifact file for a given phase and slug.
 *
 * Resolution order:
 * 1. manifest.artifacts[phase] — first entry that exists on disk
 * 2. Glob scan `.beastmode/artifacts/{phase}/` for `*-{slug}.md` — latest by date prefix
 * 3. undefined — never throws
 *
 * @param projectRoot - Absolute path to project root
 * @param phase - Phase name (e.g., "design", "plan")
 * @param slug - Epic slug to match against
 * @param manifest - Optional manifest with artifacts record
 * @returns Relative path to artifact file, or undefined
 */
export function resolveArtifactPath(
  projectRoot: string,
  phase: string,
  slug: string,
  manifest?: { artifacts: Record<string, string[]> },
): string | undefined {
  // Strategy 1: manifest.artifacts lookup
  if (manifest) {
    const paths = manifest.artifacts[phase];
    if (paths && paths.length > 0) {
      const first = paths[0];
      const abs = resolve(projectRoot, first);
      if (existsSync(abs)) {
        return first;
      }
    }
  }

  // Strategy 2: scan artifacts/{phase}/ by slug pattern
  const artifactDir = resolve(projectRoot, ".beastmode", "artifacts", phase);
  if (!existsSync(artifactDir)) return undefined;

  try {
    const files = readdirSync(artifactDir);
    const match = files
      .filter((f) => f.endsWith(`-${slug}.md`))
      .sort()
      .pop(); // Latest by lexicographic (date prefix) sort

    if (match) {
      return relative(projectRoot, join(artifactDir, match));
    }
  } catch {
    // Graceful degradation
  }

  return undefined;
}

/**
 * Resolve, read, and split an artifact file into sections.
 *
 * Orchestrates resolveArtifactPath + readFileSync + splitSections.
 * Returns undefined (with a warning log) when anything fails.
 *
 * @param projectRoot - Absolute path to project root
 * @param phase - Phase name
 * @param slug - Epic slug
 * @param manifest - Optional manifest with artifacts record
 * @param logger - Optional logger for warnings
 * @returns Map of heading -> section body, or undefined
 */
export function readArtifactSections(
  projectRoot: string,
  phase: string,
  slug: string,
  manifest?: { artifacts: Record<string, string[]> },
  logger?: Logger,
): Map<string, string> | undefined {
  const path = resolveArtifactPath(projectRoot, phase, slug, manifest);
  if (!path) {
    logger?.warn(`No ${phase} artifact found for slug "${slug}"`);
    return undefined;
  }

  let content: string;
  try {
    content = readFileSync(resolve(projectRoot, path), "utf-8");
  } catch {
    logger?.warn(`Failed to read ${phase} artifact: ${path}`);
    return undefined;
  }

  const sections = splitSections(content);
  if (sections.size === 0) {
    logger?.warn(`Empty sections in ${phase} artifact: ${path}`);
    return undefined;
  }

  return sections;
}
