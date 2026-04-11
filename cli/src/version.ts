import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Resolve the current beastmode version from plugin/plugin.json.
 *
 * When called without arguments, discovers the project root relative to
 * this module's own location (2 levels up from cli/src/ to project root).
 * Returns "v{semver}" on success, "unknown" on any failure.
 */
export function resolveVersion(projectRoot?: string): string {
  try {
    const root = projectRoot ?? resolve(import.meta.dirname, "..", "..");
    const pluginJsonPath = resolve(root, "plugin", "plugin.json");
    const content = JSON.parse(readFileSync(pluginJsonPath, "utf-8"));
    const version = content.version;
    if (typeof version !== "string" || !version) return "unknown";
    return `v${version}`;
  } catch {
    return "unknown";
  }
}
