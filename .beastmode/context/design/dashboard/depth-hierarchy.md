# Depth Hierarchy — Three-Tier Background System

## Context
The original dashboard had no background colors — all panels and chrome rendered against the raw terminal background. Visual regions were distinguished only by border lines and text color. The addition of an outer chrome border (since removed) caused panel title collisions and visual clutter rather than depth.

## Decision
Three distinct background tiers, all from the Monokai Pro palette, create depth without borders:
- **Tier 1 — Chrome** (#403E41): header bar (banner + watch status row) and hints bar — the "surface" that floats above panels
- **Tier 2 — Panel interiors** (#353236): all PanelBox content areas — the "recessed" working area
- **Tier 3 — Terminal** (#2D2A2E): the terminal's own background, visible in gaps between panels and at edges

## Rationale
The tier ordering (lightest → darkest = chrome → panel → terminal) encodes depth perceptually: heavier UI elements (chrome controls) float on top, content areas recede, the terminal background is the deepest layer. This matches the physical metaphor of a lit surface over a dark background — the reverse ordering (dark chrome, light panels) would feel inverted. Background-based depth also avoids the panel title collision problem that plagued the outer chrome border approach.

## Constraints
- ALWAYS use DEPTH constants from monokai-palette — never inline #403E41 or #353236 in components
- Chrome tier applies to header AND hints bar — both share the same background for visual continuity of the chrome band

## Source
- .beastmode/artifacts/design/2026-04-04-dashboard-polish.md
- .beastmode/artifacts/plan/2026-04-04-dashboard-polish-depth-hierarchy.md
- .beastmode/artifacts/implement/2026-04-04-dashboard-polish-depth-hierarchy.md
