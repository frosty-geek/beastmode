# NyanBanner — Color Cycling and Rendering

## Context
The original dashboard header was a plain cyan `<Text>` "beastmode" label. flashy-dashboard replaced it with a 2-line ASCII block-character banner with continuously cycling rainbow colors using a 6-stripe hard-switch palette. dashboard-polish replaced the 6-stripe palette with a 256-step interpolated palette for a smoother visual effect.

## Decision
Pure function `getNyanColor(charIndex, tickOffset)` returns a hex color string from a 256-entry interpolated palette based on `palette[(charIndex + tickOffset) % 256]`. The palette is computed at module load time via linear RGB interpolation between the 6 nyan cat anchor colors (~43 steps per transition). Spaces return `undefined` (uncolored). Both banner lines receive the same `tickOffset`. A `useEffect` in `NyanBanner.tsx` increments `tickOffset` every 80ms via `setInterval`. Fifteen trailing `▄` dot characters on banner line 2 animate with the same gradient.

## Rationale
Separating the color engine (`nyan-colors.ts`) from the component (`NyanBanner.tsx`) enables pure unit testing of the cycling logic without mounting React. The 80ms tick combined with the 256-step palette width produces a ~20-second full rotation — visually a slow, buttery color wash rather than a flickering rainbow. The 6-stripe hard-switch palette produced abrupt color jumps at palette boundaries; interpolation eliminates those without changing the anchor colors or tick rate.

## Rendering Trick — Inline Border Title Overflow
For the inline panel border titles (`┌─ EPICS ──────┐`), the implementation emits `"─".repeat(200)` after the title text and relies on terminal clipping. This is a standard terminal rendering pattern — excess characters are never displayed, the visible portion is always correct. No dynamic width calculation needed.

## Rejected Alternative
`@mishieck/ink-titled-box` (community package) was specified in the design as the mechanism for inline panel titles. Evaluated at plan/tasks.md time and rejected: small abstraction, unverified Ink v6 compatibility, adds an npm dependency for ~5 lines of code. Direct implementation preferred.

## Source
- .beastmode/artifacts/design/2026-04-04-dashboard-polish.md
- .beastmode/artifacts/plan/2026-04-04-dashboard-polish-gradient-smooth.md
- .beastmode/artifacts/implement/2026-04-04-dashboard-polish-gradient-smooth.md
