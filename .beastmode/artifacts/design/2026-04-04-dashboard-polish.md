---
phase: design
slug: dashboard-polish
epic: dashboard-polish
---

## Problem Statement

The dashboard TUI has several visual regressions and layout issues: the ASCII banner spells "BEASTMOKE" instead of "BEASTMODE" (D/K block characters swapped), panel titles ("EPICS", "OVERVIEW") collide with the outer chrome border creating broken tab-like rendering, the nyan cat gradient cycles too fast with hard color switches, and the overall color scheme doesn't match the project's Monokai Pro terminal palette. The layout also needs restructuring — the current top/bottom split wastes horizontal space for the log panel while cramping the epic list.

## Solution

Six-part visual overhaul: (1) fix the banner typo and add trailing animated dots, (2) restructure to a vertical split layout with EPICS+OVERVIEW stacked on the left and LOG at full height on the right, (3) apply the Monokai Pro color palette to all chrome, borders, phase indicators, and status elements, (4) smooth the banner gradient to a 256-step interpolated palette with wide, slow-drifting color bands, (5) add subtle background colors to the header bar, hints bar, and panel interiors for depth hierarchy, (6) remove the outer chrome border that causes the panel title collision.

## User Stories

1. As a user, I want the banner to correctly spell "BEASTMODE" with trailing animated dots matching the README SVG, so the dashboard looks polished and consistent with the project branding.

2. As a user, I want a vertical split layout (LEFT: EPICS 60% + OVERVIEW 40% stacked at 35% width | RIGHT: LOG at 65% width full height), so the log panel has maximum vertical real estate for reading session output while epics and overview remain accessible.

3. As a user, I want all dashboard colors derived from the Monokai Pro palette (borders #727072, titles #78DCE8, phase colors mapped to unique accents, status colors), so the TUI feels native to my terminal theme.

4. As a user, I want the banner gradient to use 256-step smooth interpolation between the nyan cat rainbow colors with wide bands, so the animation looks like a slow, buttery color wash instead of a flickering rainbow.

5. As a user, I want background colors on the header bar (#403E41), hints bar (#403E41), and panel interiors (#353236) creating a three-tier depth hierarchy against the terminal background (#2D2A2E), so UI regions are visually distinct without harsh borders.

6. As a user, I want the outer chrome border removed and panel titles rendered cleanly within their own PanelBox borders, so the "EPICS" and "OVERVIEW" labels no longer collide with stray border lines.

## Implementation Decisions

- **Banner ASCII art**: Fix block characters for "D" — swap `█▄▀/█▀▄` (K) to `█▀▄/█▄▀` (D) in the BANNER_LINES constant
- **Banner dots**: Append 15 `▄` characters (space-separated: `▄ ▄ ▄ ...`) to the second banner line, animated with the same gradient as the text
- **Gradient engine** (`nyan-colors.ts`): Replace the 6-color hard-switch palette with a 256-step interpolated palette. Linear RGB interpolation between adjacent nyan cat colors (~43 steps per transition). The `nyanColor()` function maps `(charIndex + tickOffset) % 256` to the interpolated palette. Keep the 80ms tick interval — the 256-step width naturally slows the visual cycle to ~20 seconds per full rotation
- **Layout restructure** (`ThreePanelLayout.tsx`): Replace the current top-row/bottom-row split with a left-column/right-column split. Left column at 35% width contains EPICS (60% height) stacked above OVERVIEW (40% height). Right column at 65% width contains LOG at full height
- **Outer chrome removal**: Remove the wrapping `<Box borderStyle="single" borderColor="cyan">` from ThreePanelLayout. Header (banner + watch status) becomes a standalone `<Box>` with `#403E41` background. Hints bar becomes a standalone `<Box>` with `#403E41` background
- **Panel box backgrounds** (`PanelBox.tsx`): Add `backgroundColor: "#353236"` to the content area box
- **Border colors**: Change PanelBox border color from `cyan` to `#727072` (Monokai gray)
- **Panel title colors**: Change PanelBox title text color from `cyan` to `#78DCE8` (Monokai cyan)
- **Phase color mapping**: Create a centralized Monokai-based phase color map used by EpicsPanel, OverviewPanel, tree-format.ts, and any other consumers:
  - design: `#AB9DF2` (purple)
  - plan: `#78DCE8` (cyan)
  - implement: `#FFD866` (yellow)
  - validate: `#A9DC76` (green)
  - release: `#FC9867` (orange)
  - done: `#A9DC76` dim
  - cancelled: `#FF6188` dim
  - blocked: `#FF6188`
- **Watch status colors**: green `#A9DC76` / red `#FF6188`
- **Clock and hints text**: `#727072` (Monokai bright black)
- **Key hints text**: Render with `color="#727072"` instead of `dimColor`

## Testing Decisions

- Visual testing: manual inspection via `beastmode dashboard` — verify banner spelling, gradient smoothness, layout proportions, color accuracy, and background contrast
- Snapshot/unit tests: if existing tests reference the old BANNER_LINES constant, nyan-colors palette, or phase color values, update them to match new values
- Regression check: verify keyboard navigation (up/down, filter, cancel) still works correctly with the new layout — epics panel is now in the left column instead of top-left
- Terminal size: verify MinSizeGate still works and the new layout degrades gracefully at minimum dimensions (80x24)

## Out of Scope

- Tagline text ("turning vibes into version-controlled artifacts") — dots only, no tagline in the dashboard banner
- SVG banner changes — the README SVG banner is not affected
- Monokai Pro colors for the nyan cat gradient — gradient keeps the classic nyan cat rainbow, only chrome/phase/status use Monokai Pro
- New panels or interactive features
- Dashboard command-line flags or configuration options for colors

## Further Notes

- The Monokai Pro palette was extracted from `/Users/D038720/Downloads/monokai-pro-iterm/Monokai_Pro.itermcolors` — ANSI colors, background, foreground, selection, bold, and cursor colors are all available
- Phase colors are currently hardcoded in multiple files (EpicsPanel.tsx, OverviewPanel.tsx, tree-format.ts) — centralizing them into a shared constant is an implementation-time decision, not a design requirement
- The `"─".repeat(200)` in PanelBox relies on terminal clipping — this pattern is fine and should be preserved

## Deferred Ideas

- Configurable color themes (user-selectable palettes beyond Monokai Pro)
- Banner text customization via config
- Responsive layout proportions based on terminal width
