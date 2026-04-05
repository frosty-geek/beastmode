import { useState, useEffect, useRef } from "react";
import { Box, Text, measureElement } from "ink";
import type { EnrichedEpic } from "../store/index.js";
import { PHASE_COLOR, CHROME, isDim, FEATURE_STATUS_COLOR, isFeatureDim } from "./monokai-palette.js";
import { buildFlatRows } from "./epics-tree-model.js";

// --- Shared utilities ---

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function InlineSpinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);
  return <Text color="yellow">{SPINNER_FRAMES[frame]}</Text>;
}

// --- Icon logic ---

export interface IconResult {
  char: string;
  color: string | undefined;
  dim: boolean;
  spinner: boolean;
}

export function getEpicIcon(
  isSelected: boolean,
  isActive: boolean,
  phase: string,
): IconResult {
  if (isSelected) {
    return { char: ">", color: CHROME.title, dim: false, spinner: false };
  }
  if (isActive) {
    return { char: "", color: "yellow", dim: false, spinner: true };
  }
  if (isDim(phase)) {
    return { char: "\u00b7", color: undefined, dim: true, spinner: false };
  }
  return {
    char: "\u00b7",
    color: PHASE_COLOR[phase],
    dim: false,
    spinner: false,
  };
}

// --- Props ---

export interface EpicsPanelProps {
  /** Epic list (already filtered/sorted by parent) */
  epics: EnrichedEpic[];
  /** Set of epic slugs with active sessions */
  activeSessions: Set<string>;
  /** Currently selected row index (0 = "(all)" entry) */
  selectedIndex: number;
  /** Slug currently in cancel-confirmation state */
  cancelConfirmingSlug?: string;
  /** Slug of the currently expanded epic (if any) */
  expandedEpicSlug?: string;
}

// --- Component ---

export default function EpicsPanel({
  epics,
  activeSessions,
  selectedIndex,
  cancelConfirmingSlug,
  expandedEpicSlug,
}: EpicsPanelProps) {
  const ref = useRef(null);
  const [visibleRows, setVisibleRows] = useState(Infinity);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Measure available height for viewport scrolling
  useEffect(() => {
    if (ref.current) {
      const { height } = measureElement(ref.current);
      if (height !== visibleRows) setVisibleRows(height);
    }
  });

  // Keep selected index in view
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + visibleRows) {
      setScrollOffset(selectedIndex - visibleRows + 1);
    }
  }, [selectedIndex, visibleRows]);

  const flatRows = buildFlatRows(epics, expandedEpicSlug);

  const slugWidth =
    Math.max(12, ...epics.map((e) => e.slug.length)) + 2;

  // Build renderable rows from flat model
  const renderedRows: React.ReactNode[] = [];

  for (let i = 0; i < flatRows.length; i++) {
    const row = flatRows[i];
    const isSelected = i === selectedIndex;

    if (row.type === "all") {
      renderedRows.push(
        <Box key="__all__">
          <Box width={2}>
            <Text color={CHROME.title}>{isSelected ? ">" : " "}</Text>
          </Box>
          <Text inverse={isSelected} color={isSelected ? CHROME.title : undefined}>
            (all)
          </Text>
        </Box>,
      );
    } else if (row.type === "epic") {
      const epic = row.epic;
      const isActive = activeSessions.has(epic.slug);
      const isConfirming = cancelConfirmingSlug === epic.slug;
      const dim = isDim(epic.status);
      const icon = getEpicIcon(isSelected, isActive, epic.status);
      const isExpanded = expandedEpicSlug === epic.slug;

      renderedRows.push(
        <Box key={epic.slug}>
          <Box width={2}>
            {icon.spinner ? (
              <InlineSpinner />
            ) : (
              <Text
                color={icon.color as Parameters<typeof Text>[0]["color"]}
                dimColor={icon.dim}
              >
                {icon.char}
              </Text>
            )}
          </Box>
          <Box width={slugWidth}>
            <Text inverse={isSelected} dimColor={dim}>
              {isExpanded ? "\u25BE " : "\u25B8 "}{epic.slug}
            </Text>
          </Box>
          <Box>
            {isConfirming ? (
              <Text color="red" bold>
                Cancel {epic.slug}? y/n
              </Text>
            ) : (
              <Text
                color={PHASE_COLOR[epic.status] as Parameters<typeof Text>[0]["color"]}
                dimColor={dim}
              >
                {epic.status}
              </Text>
            )}
          </Box>
        </Box>,
      );
    } else if (row.type === "feature") {
      const dim = isFeatureDim(row.featureStatus);
      const color = FEATURE_STATUS_COLOR[row.featureStatus] as Parameters<typeof Text>[0]["color"];

      renderedRows.push(
        <Box key={`${row.epicSlug}/${row.slug}`} paddingLeft={4}>
          <Box width={2}>
            <Text color={isSelected ? CHROME.title : color} dimColor={!isSelected && dim}>
              {isSelected ? ">" : "\u00b7"}
            </Text>
          </Box>
          <Box width={slugWidth - 2}>
            <Text inverse={isSelected} dimColor={dim}>
              {row.slug}
            </Text>
          </Box>
          <Box>
            <Text color={color} dimColor={dim}>
              {row.featureStatus}
            </Text>
          </Box>
        </Box>,
      );
    }
  }

  if (epics.length === 0) {
    renderedRows.push(
      <Box key="__empty__" paddingLeft={2}>
        <Text dimColor>no epics</Text>
      </Box>,
    );
  }

  const visible = visibleRows < Infinity
    ? renderedRows.slice(scrollOffset, scrollOffset + visibleRows)
    : renderedRows;

  return (
    <Box ref={ref} flexDirection="column" flexGrow={1}>
      {visible}
    </Box>
  );
}
