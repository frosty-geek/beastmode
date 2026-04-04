# Monokai Pro Palette Module — Centralized Color Constants

## Context
Before dashboard-polish, phase color maps were defined independently in three files (EpicsPanel.tsx, OverviewPanel.tsx, tree-format.ts). Chrome colors (border cyan, title cyan) were inlined at each usage site. This produced silent drift: any future color change required finding and updating all three sites.

## Decision
A single `monokai-palette` module exports all dashboard color constants:
- `PHASE_COLORS`: keyed by phase slug (design/plan/implement/validate/release/done/cancelled/blocked) with Monokai Pro hex values
- Chrome constants: `BORDER` (#727072), `TITLE` (#78DCE8), `WATCH_RUNNING` (#A9DC76), `WATCH_STOPPED` (#FF6188), `CLOCK_HINTS` (#727072)
- `DEPTH` constants: `CHROME` (#403E41), `PANEL` (#353236), `TERMINAL` (#2D2A2E)

All consumers (EpicsPanel, OverviewPanel, PanelBox, ThreePanelLayout, tree-format, status.ts) import from this module. Zero duplicate definitions remain.

## Rationale
Single source of truth eliminates silent color drift. The constraint "zero duplicate PHASE_COLOR definitions" is enforceable by grep — a future audit can verify compliance without reading every consumer. Grouping chrome colors and depth constants in the same module keeps all visual constants in one place for designers reading the codebase.

## Constraints
- NEVER define phase or chrome colors inline in consumer components — always import from monokai-palette
- Nyan cat gradient colors in nyan-colors.ts are NOT part of this module — they are animation anchors, not UI chrome

## Source
- .beastmode/artifacts/design/2026-04-04-dashboard-polish.md
- .beastmode/artifacts/plan/2026-04-04-dashboard-polish-monokai-palette.md
- .beastmode/artifacts/implement/2026-04-04-dashboard-polish-monokai-palette.md
