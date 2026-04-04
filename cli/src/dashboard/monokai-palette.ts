/**
 * Centralized Monokai Pro color palette for the dashboard.
 *
 * Single source of truth for all phase colors, chrome colors,
 * and dim-state logic. Consumers import from here.
 */

/** Phase-to-hex-color mapping (Monokai Pro accent palette). */
export const PHASE_COLOR: Record<string, string> = {
  design: "#AB9DF2",
  plan: "#78DCE8",
  implement: "#FFD866",
  validate: "#A9DC76",
  release: "#FC9867",
  done: "#A9DC76",
  cancelled: "#FF6188",
  blocked: "#FF6188",
};

/** Chrome colors for borders, titles, status indicators, and muted text. */
export const CHROME = {
  border: "#727072",
  title: "#78DCE8",
  watchRunning: "#A9DC76",
  watchStopped: "#FF6188",
  muted: "#727072",
} as const;

/** Background depth tiers — lightest (chrome) to mid (panels). Terminal bg is deepest. */
export const DEPTH = {
  chrome: "#403E41",
  panel: "#353236",
} as const;

/** Returns true for phases that should render dimmed. */
export function isDim(phase: string): boolean {
  return phase === "done" || phase === "cancelled";
}
