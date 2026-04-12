/**
 * Re-export shim — flat tree types moved to tree-view/flat-types.ts.
 * Kept for backward compatibility with dashboard-internal consumers.
 */
export type {
  TreeEntry,
  FeatureNode,
  EpicNode,
  SystemEntry,
  CliNode,
  TreeState,
} from "../tree-view/flat-types.js";
