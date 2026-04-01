# Phase Detection

## Context
`beastmode <phase> <slug>` only handled forward transitions. Users who discovered issues in earlier phase output had no recourse short of starting a new epic.

## Decision
Detection matrix compares requested phase against manifest.phase: requested < current = regression, requested == current (with prior commits) = same-phase rerun, requested == current (no prior commits) = normal forward, requested > current = forward-jump blocked. Regression and same-phase rerun both reset to predecessor tag and rerun uniformly. Plan is the earliest valid target; design is excluded. Manual CLI prompts for confirmation; watch loop skips prompt.

## Rationale
Overloading the existing command avoids a separate `beastmode regress` command. The four-case matrix is exhaustive — no ambiguous states. Forward-jump blocking prevents skipping phases. Same-phase rerun uses the same reset mechanism as regression for implementation simplicity. Design exclusion reflects its interactive nature — starting a new epic is the correct path.

## Source
.beastmode/artifacts/design/2026-04-01-phase-rerun.md
.beastmode/artifacts/implement/2026-04-01-phase-rerun-phase-detection.md
