---
phase: plan
slug: watch-log-format
epic: watch-log-format
feature: format-columns
wave: 1
---

# Format Columns

**Design:** `.beastmode/artifacts/design/2026-04-03-watch-log-format.md`

## User Stories

1. As an operator watching the pipeline, I want log lines to align vertically so that I can scan output quickly without visual noise from ragged indentation.
2. As an operator watching the pipeline, I want to see the phase as a distinct visual column so that I can filter by phase at a glance without parsing the scope path.
5. As a dashboard user, I want the dashboard activity log to use the same improved format so that the headless and TUI experiences are consistent.

## What to Build

Restructure the shared `formatLogLine` function and its `buildScope` helper to produce a new column layout:

**Phase Column:** Extract phase from `LogContext` and render it as a fixed-width 9-character column (padded to match "implement", the longest phase name). When no phase is present in context, emit 9 spaces to preserve alignment.

**Scope Column:** Remove phase from scope construction. Scope now contains only epic and optional feature, falling back to "cli" when no epic is set. Apply a 32-character total budget: when only epic is present it gets the full 32 characters; when both epic and feature are present each gets 16. Names exceeding their budget are truncated with a trailing ellipsis character. Wrap scope in parentheses as before.

**Column Alignment:** The output format becomes `[HH:MM:SS] LEVEL  PHASE  (scope):  message` where PHASE is the new fixed-width column. Adjust column width calculations so the message column starts at a consistent position regardless of scope length (within the 32-char budget).

**Color Strategy:** Maintain existing behavior: WARN and ERR color the entire line (now including the phase column). Other levels use per-field coloring with phase getting its own color treatment.

**Dashboard Propagation:** The dashboard ActivityLog component already calls `formatLogLine` — the format change propagates automatically. Verify that DashboardEvent fields map correctly to the new LogContext interpretation (phase separate from scope).

**Tests:** Update existing `log-format.test.ts` tests to match the new format. Add test cases for: phase extraction and padding, scope truncation at exact boundaries (16 and 32 chars), ellipsis behavior, no-phase blank column, and WARN/ERR full-line coloring with the phase column included. Update `activity-log.test.ts` assertions to match new format.

## Acceptance Criteria

- [ ] Phase renders as a 9-character fixed-width column between level and scope
- [ ] Scope contains only epic/feature (no phase), falls back to "cli"
- [ ] Scope truncates at 32-char budget (16 each when both epic and feature present)
- [ ] Truncated names end with ellipsis
- [ ] No-phase lines show blank phase column with correct spacing
- [ ] WARN/ERR color the entire line including phase column
- [ ] Dashboard activity log renders with new format (no dashboard-specific changes needed)
- [ ] All log-format and activity-log tests pass with updated assertions
