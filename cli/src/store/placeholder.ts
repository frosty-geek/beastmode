/**
 * Docker-style placeholder name generator for design-phase epics.
 *
 * Format: {adjective}-{noun}-{4hex}
 * Uses a curated word list for ~2,500 combinations.
 * Deterministic: same hex input always produces the same name.
 */

export const ADJECTIVES: readonly string[] = [
  "agile", "bold", "brave", "bright", "calm",
  "clean", "clever", "cool", "crisp", "deft",
  "eager", "fair", "fast", "firm", "fond",
  "glad", "grand", "great", "green", "happy",
  "hardy", "keen", "kind", "lively", "loyal",
  "lucky", "merry", "mild", "neat", "nice",
  "noble", "plain", "plucky", "proud", "quick",
  "quiet", "rapid", "ready", "rich", "robust",
  "sharp", "sleek", "smart", "solid", "steady",
  "stout", "swift", "tidy", "tough", "vivid",
] as const;

export const NOUNS: readonly string[] = [
  "anchor", "arrow", "badge", "beacon", "blade",
  "bolt", "bridge", "brook", "castle", "cedar",
  "cliff", "cloud", "comet", "coral", "crane",
  "crystal", "dawn", "delta", "ember", "falcon",
  "flame", "forge", "frost", "garden", "glacier",
  "grove", "harbor", "hawk", "iris", "jade",
  "lake", "lark", "leaf", "maple", "meadow",
  "moon", "oak", "ocean", "peak", "pine",
  "plume", "quartz", "raven", "reef", "ridge",
  "river", "sage", "shore", "spark", "stone",
] as const;

/**
 * Generate a deterministic placeholder name from a 4-char hex string.
 *
 * The hex value is parsed as an integer and used to select an adjective
 * and noun from the curated word lists. The hex suffix is appended as-is.
 *
 * @param shortHex - A 4-character hex string (e.g., "a1b2")
 * @returns A placeholder name like "bold-falcon-a1b2"
 */
export function generatePlaceholderName(shortHex: string): string {
  const value = parseInt(shortHex, 16);
  const adjIndex = value % ADJECTIVES.length;
  const nounIndex = Math.floor(value / ADJECTIVES.length) % NOUNS.length;
  return `${ADJECTIVES[adjIndex]}-${NOUNS[nounIndex]}-${shortHex}`;
}
