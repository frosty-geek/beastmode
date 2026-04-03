import type { TreeState as RecursiveTreeState, TreeNode, TreeEntry as RecursiveEntry } from "./types.js";
import type {
  TreeState as FlatTreeState,
  EpicNode,
  PhaseNode,
  FeatureNode,
  TreeEntry as FlatEntry,
  SystemEntry,
} from "../dashboard/tree-types.js";

let _seq = 0;

function toFlatEntry(entry: RecursiveEntry): FlatEntry {
  return {
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    seq: ++_seq,
  };
}

function toSystemEntry(entry: RecursiveEntry): SystemEntry {
  return {
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    seq: ++_seq,
  };
}

function toFeatureNode(node: TreeNode): FeatureNode {
  return {
    slug: node.label,
    entries: node.entries.map(toFlatEntry),
  };
}

function toPhaseNode(node: TreeNode): PhaseNode {
  return {
    phase: node.label,
    features: node.children
      .filter((c) => c.type === "feature")
      .map(toFeatureNode),
    entries: node.entries.map(toFlatEntry),
  };
}

function toEpicNode(node: TreeNode): EpicNode {
  return {
    slug: node.label,
    phases: node.children
      .filter((c) => c.type === "phase")
      .map(toPhaseNode),
  };
}

/**
 * Convert the recursive TreeState (tree-view module) to the flat
 * TreeState (dashboard types) for use with the shared TreeView component.
 */
export function toFlatTreeState(state: RecursiveTreeState): FlatTreeState {
  return {
    epics: state.epics.map(toEpicNode),
    system: state.systemEntries.map(toSystemEntry),
  };
}
