// Types
export type { TreeEntry, TreeNode, TreeNodeType, TreeState } from "./types.js";

// Flat tree types (dashboard format)
export type {
  TreeState as FlatTreeState,
  EpicNode,
  FeatureNode,
  TreeEntry as FlatTreeEntry,
  SystemEntry,
  CliNode,
} from "./flat-types.js";

// State mutations
export { createTreeState, addEntry, openPhase, closePhase } from "./tree-state.js";

// Logger
export { createTreeSink } from "./tree-sink.js";

// Format
export { formatTreeLogLine } from "./format.js";

// React hook
export { useTreeState } from "./use-tree-state.js";
export type { UseTreeStateResult } from "./use-tree-state.js";

// Adapter
export { toFlatTreeState } from "./adapter.js";
