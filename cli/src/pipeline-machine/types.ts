import type { EpicStatus, FeatureStatus } from "../store/index.js";

// ── Epic machine context ─────────────────────────────────────────
// Mirrors the store's Epic entity shape. The machine context IS the
// Epic entity — no adapter layer. Fields not present on store Epic
// (like features array for the machine's internal tracking) are kept
// as machine-only extensions.

export interface EpicContext {
  // Store entity fields
  id: string;
  slug: string;
  name: string;
  status: EpicStatus;
  summary?: string | { problem: string; solution: string };
  worktree?: { branch: string; path: string };
  depends_on: string[];
  created_at: string;
  updated_at: string;
  // Phase artifact references (on Epic entity)
  design?: string;
  plan?: string;
  implement?: string;
  validate?: string;
  release?: string;
  // Machine-specific: features tracked inline for guard evaluation
  // These are lightweight projections of store Features, not full entities
  features: MachineFeature[];
  // Machine-specific: accumulated artifact paths per phase
  artifacts: Record<string, string[]>;
}

/** Lightweight feature projection for machine context.
 *  Carries only what the machine needs for guards and actions.
 */
export interface MachineFeature {
  slug: string;
  name?: string;
  plan: string;
  description?: string;
  wave?: number;
  status: FeatureStatus;
  reDispatchCount?: number;
}

export type EpicEvent =
  | { type: "DESIGN_COMPLETED"; realSlug?: string; summary?: { problem: string; solution: string }; artifacts?: Record<string, string[]> }
  | { type: "PLAN_COMPLETED"; features: Array<{ slug: string; plan: string; description?: string; wave?: number }>; artifacts?: Record<string, string[]> }
  | { type: "FEATURE_COMPLETED"; featureSlug: string }
  | { type: "IMPLEMENT_COMPLETED" }
  | { type: "VALIDATE_COMPLETED" }
  | { type: "REGRESS"; targetPhase: EpicStatus }
  | { type: "REGRESS_FEATURES"; failingFeatures: string[] }
  | { type: "RELEASE_COMPLETED" }
  | { type: "CANCEL" };

// ── Feature machine context ──────────────────────────────────────
// Mirrors the store's Feature entity shape for the feature sub-machine.

export interface FeatureContext {
  id: string;
  slug: string;
  name: string;
  plan?: string;
  description?: string;
  status: FeatureStatus;
}

export type FeatureEvent =
  | { type: "START" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

// ── Dispatch strategy ───────────────────────────────────────────

export type DispatchType = "single" | "fan-out" | "skip";
