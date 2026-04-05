/**
 * epics-tree-model — pure functions for the expandable epics tree.
 *
 * Builds a flat list of selectable rows from the enriched epic array,
 * inserting feature rows under the currently expanded epic.
 */

import type { EnrichedEpic } from "../store/types.js";

/** Discriminated union for rows in the epics panel. */
export type SelectableRow =
  | { type: "all"; slug: undefined; epicSlug: undefined; featureStatus: undefined }
  | { type: "epic"; slug: string; epicSlug: undefined; featureStatus: undefined; epic: EnrichedEpic }
  | { type: "feature"; slug: string; epicSlug: string; featureStatus: string };

/** Selection result from rowSlugAtIndex. */
export type RowSelection = undefined | string | { epicSlug: string; featureSlug: string };

/**
 * Build a flat list of selectable rows from the epics array.
 *
 * - Index 0 is always the "(all)" row.
 * - Each epic is an epic row.
 * - If `expandedEpicSlug` matches an epic's slug, its features are inserted
 *   as indented rows immediately after the epic row.
 */
export function buildFlatRows(
  epics: EnrichedEpic[],
  expandedEpicSlug: string | undefined,
): SelectableRow[] {
  const rows: SelectableRow[] = [
    { type: "all", slug: undefined, epicSlug: undefined, featureStatus: undefined },
  ];

  for (const epic of epics) {
    rows.push({
      type: "epic",
      slug: epic.slug,
      epicSlug: undefined,
      featureStatus: undefined,
      epic,
    });

    if (expandedEpicSlug === epic.slug) {
      for (const feature of epic.features) {
        rows.push({
          type: "feature",
          slug: feature.slug,
          epicSlug: epic.slug,
          featureStatus: feature.status,
        });
      }
    }
  }

  return rows;
}

/**
 * Resolve the selection at a given row index.
 *
 * Returns:
 * - `undefined` for index 0 (the "(all)" row) or out-of-range
 * - `string` (epic slug) for epic rows
 * - `{ epicSlug, featureSlug }` for feature rows
 */
export function rowSlugAtIndex(
  rows: SelectableRow[],
  index: number,
): RowSelection {
  const row = rows[index];
  if (!row || row.type === "all") return undefined;
  if (row.type === "epic") return row.slug;
  return { epicSlug: row.epicSlug, featureSlug: row.slug };
}
