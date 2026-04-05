import { Box, Text } from "ink";
import type { TreeState, EpicNode } from "./tree-types.js";
import TreeView from "./TreeView.js";
import { shouldShowEntry } from "./verbosity.js";

export interface LogPanelProps {
  /** Tree state to render. */
  state: TreeState;
  /** Current verbosity level (0=info, 1=debug). Default: 0 */
  verbosity?: number;
}

/**
 * Count total rendered lines in a tree state.
 * CLI root label + CLI entries + for each epic (1 label + direct entries + for each feature (1 label + entries)).
 */
export function countTreeLines(state: TreeState): number {
  // CLI root: always 1 label + N entries
  let count = 1 + state.cli.entries.length;

  for (const epic of state.epics) {
    count += 1; // epic label
    count += epic.entries.length; // direct entries
    for (const feat of epic.features) {
      count += 1; // feature label
      count += feat.entries.length;
    }
  }
  return count;
}

/**
 * Trim a tree state to the last N rendered lines by dropping
 * oldest entries from the front. Preserves tree structure (labels)
 * and removes leaf entries from earliest epics first.
 */
export function trimTreeToTail(state: TreeState, maxLines: number): TreeState {
  const total = countTreeLines(state);
  if (total <= maxLines) return state;

  let toDrop = total - maxLines;

  // Drop CLI entries first (oldest)
  let cliEntries = state.cli.entries;
  if (toDrop > 0 && cliEntries.length > 0) {
    const cliDrop = Math.min(toDrop, cliEntries.length);
    cliEntries = cliEntries.slice(cliDrop);
    toDrop -= cliDrop;
  }

  if (toDrop <= 0) return { cli: { entries: cliEntries }, epics: state.epics };

  // Drop from epics in order (oldest first)
  const epics: EpicNode[] = [];
  for (const epic of state.epics) {
    if (toDrop <= 0) {
      epics.push(epic);
      continue;
    }

    // Drop epic direct entries
    const epicEntryDrop = Math.min(toDrop, epic.entries.length);
    const entries = epic.entries.slice(epicEntryDrop);
    toDrop -= epicEntryDrop;

    // Drop feature entries
    const features = [];
    for (const feat of epic.features) {
      if (toDrop <= 0) {
        features.push(feat);
        continue;
      }
      const featEntryDrop = Math.min(toDrop, feat.entries.length);
      const fEntries = feat.entries.slice(featEntryDrop);
      toDrop -= featEntryDrop;
      features.push({ ...feat, entries: fEntries });
    }

    epics.push({ ...epic, entries, features });
  }

  return { cli: { entries: cliEntries }, epics };
}

/**
 * Filter tree entries by verbosity level.
 * Entries with level above current verbosity are removed.
 * CLI entries are not filtered (always shown).
 * warn/error entries are always shown regardless of verbosity.
 */
export function filterTreeByVerbosity(state: TreeState, verbosity: number): TreeState {
  return {
    cli: state.cli, // CLI entries always shown
    epics: state.epics.map((epic) => ({
      ...epic,
      entries: epic.entries.filter((e) => shouldShowEntry(e.level, verbosity)),
      features: epic.features.map((feat) => ({
        ...feat,
        entries: feat.entries.filter((e) => shouldShowEntry(e.level, verbosity)),
      })),
    })),
  };
}

/**
 * LogPanel — renders pipeline log entries as a hierarchical tree.
 *
 * Full scrollback — all entries rendered. No trim limit.
 */
export default function LogPanel({
  state,
  verbosity = 0,
}: LogPanelProps) {
  const filtered = filterTreeByVerbosity(state, verbosity);
  const hasContent = filtered.epics.length > 0 || filtered.cli.entries.length > 0;

  if (!hasContent) {
    return (
      <Box justifyContent="center" alignItems="center" flexGrow={1}>
        <Text dimColor>no active sessions</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <TreeView state={filtered} />
    </Box>
  );
}
