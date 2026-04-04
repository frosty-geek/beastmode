# View Stack (Superseded)

## Context
Original dashboard design used push/pop view stack (EpicList > FeatureList > AgentLog) with breadcrumb bar. Implemented in v0.66.0 but replaced before wiring.

## Decision
Replaced by flat three-panel layout (ThreePanelLayout with EpicsPanel, DetailsPanel, LogPanel slots). View stack module, all drill-down components, and associated keyboard hooks deleted in dashboard-wiring epic (2026-04-04).

## Rationale
Flat model eliminated navigation complexity. All information visible simultaneously — no hidden state behind drill-down levels. k9s-style panel composition is the established UX pattern for terminal dashboards.

## Source
.beastmode/artifacts/design/2026-04-04-dashboard-wiring.md
