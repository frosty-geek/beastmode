/**
 * Shared types for the beastmode CLI.
 */

/** Valid beastmode workflow phases */
export type Phase = "design" | "plan" | "implement" | "validate" | "release" | "released";

/** Valid top-level CLI commands: phases + utilities */
export type Command = Phase | "watch" | "status" | "help";

/** A single entry in .beastmode-runs.json */
export interface RunLogEntry {
  epic: string | null;
  phase: Phase;
  feature: string | null;
  cost_usd: number | null;
  duration_ms: number;
  exit_status: "success" | "error" | "cancelled";
  timestamp: string;
  session_id: string | null;
}

/** Result from a phase execution */
export interface PhaseResult {
  exit_status: "success" | "error" | "cancelled";
  cost_usd: number | null;
  duration_ms: number;
  session_id: string | null;
}

export const VALID_PHASES: readonly Phase[] = [
  "design",
  "plan",
  "implement",
  "validate",
  "release",
  "released",
] as const;

export function isValidPhase(s: string): s is Phase {
  return (VALID_PHASES as readonly string[]).includes(s);
}
