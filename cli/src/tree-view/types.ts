import type { LogLevel, LogContext } from "../logger.js";

/** A leaf-level log entry in the tree. */
export interface TreeEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  context: LogContext;
}

/** Node types in the tree hierarchy. */
export type TreeNodeType = "epic" | "phase" | "feature" | "system";

/** A node in the tree — can contain child nodes and/or log entries. */
export interface TreeNode {
  id: string;
  label: string;
  type: TreeNodeType;
  children: TreeNode[];
  entries: TreeEntry[];
  closed: boolean;
}

/** Root-level tree state: ordered list of epic trees plus flat system entries. */
export interface TreeState {
  /** Epic-level nodes, ordered by insertion (first-seen). */
  epics: TreeNode[];
  /** System-level entries (no epic context). */
  systemEntries: TreeEntry[];
}
