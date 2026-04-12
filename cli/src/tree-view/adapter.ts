import type { TreeState as RecursiveTreeState, TreeNode, TreeEntry as RecursiveEntry } from "./types.js";
import type {
  TreeState as FlatTreeState,
  EpicNode,
  FeatureNode,
  TreeEntry as FlatEntry,
  SystemEntry,
} from "./flat-types.js";

let _seq = 0;

function toFlatEntry(entry: RecursiveEntry, phase: string): FlatEntry {
  return {
    timestamp: entry.timestamp,
    level: entry.level,
    message: entry.message,
    seq: ++_seq,
    phase,
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

function toFeatureNode(node: TreeNode, phase: string): FeatureNode {
  return {
    slug: node.label,
    status: "in-progress",
    entries: node.entries.map((e) => toFlatEntry(e, phase)),
  };
}

function toEpicNode(node: TreeNode): EpicNode {
  // Flatten phase children: collect all features and entries across phases
  const features: FeatureNode[] = [];
  const entries: FlatEntry[] = [];

  // Epic-level direct entries (no phase context)
  for (const e of node.entries) {
    entries.push(toFlatEntry(e, "unknown"));
  }

  // Phase children → flatten into features and entries
  for (const phaseChild of node.children.filter((c) => c.type === "phase")) {
    const phase = phaseChild.label;
    // Phase-level entries become epic direct entries with phase tag
    for (const e of phaseChild.entries) {
      entries.push(toFlatEntry(e, phase));
    }
    // Feature children carry the phase from their parent
    for (const featChild of phaseChild.children.filter((c) => c.type === "feature")) {
      features.push(toFeatureNode(featChild, phase));
    }
  }

  return {
    slug: node.label,
    status: "in-progress",
    features,
    entries,
  };
}

/**
 * Convert the recursive TreeState (tree-view module) to the flat
 * TreeState (dashboard types) for use with the shared TreeView component.
 */
export function toFlatTreeState(state: RecursiveTreeState): FlatTreeState {
  return {
    cli: { entries: state.systemEntries.map(toSystemEntry) },
    epics: state.epics.map(toEpicNode),
  };
}
