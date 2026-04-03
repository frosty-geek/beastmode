/**
 * Tree data types for the hierarchical log view.
 *
 * Three-level hierarchy: Epic > Phase > Feature
 * Leaf entries attach to phases (no feature) or features.
 */

import type { LogLevel } from "../logger.js";

/** A leaf log entry in the tree. */
export interface TreeEntry {
  /** Timestamp in milliseconds since epoch. */
  timestamp: number;
  /** Log level for coloring. */
  level: LogLevel;
  /** Message text. */
  message: string;
  /** Unique sequence number for stable ordering. */
  seq: number;
}

/** A feature node under a phase. */
export interface FeatureNode {
  /** Feature slug. */
  slug: string;
  /** Leaf entries under this feature. */
  entries: TreeEntry[];
}

/** A phase node under an epic. */
export interface PhaseNode {
  /** Phase name (design, plan, implement, validate, release). */
  phase: string;
  /** Feature nodes under this phase (implement fan-out). */
  features: FeatureNode[];
  /** Leaf entries directly under the phase (no feature). */
  entries: TreeEntry[];
}

/** An epic node — top level of the tree. */
export interface EpicNode {
  /** Epic slug. */
  slug: string;
  /** Phase nodes under this epic. */
  phases: PhaseNode[];
}

/** System-level entry — renders flat, no tree prefix. */
export interface SystemEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  seq: number;
}

/** Full tree state passed to the TreeView component. */
export interface TreeState {
  /** Epic trees, ordered by creation time. */
  epics: EpicNode[];
  /** System-level messages (startup, shutdown, etc.). */
  system: SystemEntry[];
}
