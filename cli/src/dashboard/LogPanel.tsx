import { Box, Text } from "ink";
import type { TreeState } from "./tree-types.js";
import TreeView from "./TreeView.js";

export interface LogPanelProps {
  /** Tree state to render. */
  state: TreeState;
  /** Maximum visible lines to render. Default: 50 */
  maxVisibleLines?: number;
}

/**
 * LogPanel — renders pipeline log entries as a hierarchical tree.
 *
 * Uses the shared TreeView component for consistent rendering between
 * watch and dashboard. Applies a viewport window (last N rendered lines)
 * for auto-follow behavior in the dashboard's alternate screen buffer.
 */
export default function LogPanel({
  state,
  maxVisibleLines = 50,
}: LogPanelProps) {
  const hasContent = state.epics.length > 0 || state.system.length > 0;

  if (!hasContent) {
    return (
      <Box justifyContent="center" alignItems="center" flexGrow={1}>
        <Text dimColor>no active sessions</Text>
      </Box>
    );
  }

  // Viewport windowing: wrap TreeView in a Box with maxHeight
  // to show only the last N lines (auto-follow newest entries)
  return (
    <Box flexDirection="column" height={maxVisibleLines} overflow="hidden">
      <TreeView state={state} />
    </Box>
  );
}
