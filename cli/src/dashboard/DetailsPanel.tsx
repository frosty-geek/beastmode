import { Box, Text } from "ink";
import type { EnrichedEpic } from "../store/index.js";
import type { GitStatus } from "./overview-panel.js";
import {
  type DetailsPanelSelection,
  resolveDetailsContent,
} from "./details-panel.js";
import { PHASE_COLOR } from "./monokai-palette.js";

export interface DetailsPanelProps {
  selection: DetailsPanelSelection;
  projectRoot?: string;
  epics: EnrichedEpic[];
  activeSessions: number;
  gitStatus: GitStatus | null;
  scrollOffset: number;
  visibleHeight: number;
}

export default function DetailsPanel({
  selection,
  projectRoot,
  epics,
  activeSessions,
  gitStatus,
  scrollOffset,
  visibleHeight,
}: DetailsPanelProps) {
  const result = resolveDetailsContent(selection, {
    epics,
    activeSessions,
    gitStatus,
    projectRoot,
  });

  if (result.kind === "overview") {
    return (
      <Box flexDirection="column" overflowY="hidden">
        <Text bold>Phase Distribution</Text>
        {result.distribution.length === 0 ? (
          <Text dimColor>  no epics</Text>
        ) : (
          result.distribution.map(({ phase, count }) => (
            <Text key={phase}>
              {"  "}
              <Text color={PHASE_COLOR[phase] as Parameters<typeof Text>[0]["color"]}>
                {phase}
              </Text>
              {" "}
              {count}
            </Text>
          ))
        )}

        <Text> </Text>

        <Text bold>Sessions</Text>
        <Text>  {result.sessions}</Text>

        <Text> </Text>

        <Text bold>Git</Text>
        {result.git ? (
          <Text>  {result.git}</Text>
        ) : (
          <Text dimColor>  loading...</Text>
        )}
      </Box>
    );
  }

  if (result.kind === "not-found") {
    return (
      <Box flexDirection="column" overflowY="hidden">
        <Text dimColor>{result.message}</Text>
      </Box>
    );
  }

  // Artifact content — render as scrollable raw text
  const lines = result.text.split("\n");
  const clampedOffset = Math.max(0, Math.min(scrollOffset, Math.max(0, lines.length - visibleHeight)));
  const visibleLines = lines.slice(clampedOffset, clampedOffset + visibleHeight);

  return (
    <Box flexDirection="column" overflowY="hidden">
      {visibleLines.map((line, i) => (
        <Text key={clampedOffset + i}>{line || " "}</Text>
      ))}
    </Box>
  );
}
