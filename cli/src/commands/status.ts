import type { BeastmodeConfig } from "../config";
import { scanEpics, type EpicState } from "../state-scanner";

export interface StatusRow {
  name: string;
  phase: string;
  progress: string;
  blocked: string;
  lastActivity: string;
}

function formatProgress(epic: EpicState): string {
  if (epic.phase !== "implement") return "-";
  const total = epic.features.length;
  if (total === 0) return "-";
  const completed = epic.features.filter(
    (f) => f.status === "completed",
  ).length;
  return `${completed}/${total}`;
}

function formatBlocked(epic: EpicState): string {
  if (!epic.blocked && !epic.gateBlocked) return "-";
  return epic.blockedGate ?? epic.gateName ?? "yes";
}

function formatLastActivity(epic: EpicState): string {
  if (!epic.lastUpdated) return "-";
  return epic.lastUpdated.slice(0, 19).replace("T", " ");
}

export function buildStatusRows(epics: EpicState[]): StatusRow[] {
  return epics
    .sort((a, b) => {
      const aTime = a.lastUpdated ?? "";
      const bTime = b.lastUpdated ?? "";
      if (!aTime && !bTime) return a.slug.localeCompare(b.slug);
      if (!aTime) return 1;
      if (!bTime) return -1;
      return bTime.localeCompare(aTime);
    })
    .map((epic) => ({
      name: epic.slug,
      phase: epic.phase,
      progress: formatProgress(epic),
      blocked: formatBlocked(epic),
      lastActivity: formatLastActivity(epic),
    }));
}

function pad(str: string, len: number): string {
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

export function formatTable(rows: StatusRow[]): string {
  if (rows.length === 0) return "No epics found.";

  const headers: (keyof StatusRow)[] = [
    "name",
    "phase",
    "progress",
    "blocked",
    "lastActivity",
  ];
  const labels: Record<keyof StatusRow, string> = {
    name: "Epic",
    phase: "Phase",
    progress: "Progress",
    blocked: "Blocked",
    lastActivity: "Last Activity",
  };

  const widths = Object.fromEntries(
    headers.map((h) => [
      h,
      Math.max(labels[h].length, ...rows.map((r) => r[h].length)),
    ]),
  ) as Record<keyof StatusRow, number>;

  const headerLine = headers.map((h) => pad(labels[h], widths[h])).join("  ");
  const separator = headers.map((h) => "-".repeat(widths[h])).join("  ");
  const dataLines = rows.map((row) =>
    headers.map((h) => pad(row[h], widths[h])).join("  "),
  );

  return [headerLine, separator, ...dataLines].join("\n");
}

export async function statusCommand(_config: BeastmodeConfig): Promise<void> {
  const projectRoot = process.cwd();
  const epics = await scanEpics(projectRoot);
  const rows = buildStatusRows(epics);
  console.log(formatTable(rows));
}
