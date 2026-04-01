# Phase Tags

## Context
Phase regression needs deterministic commit identification for reset targets. Commit message parsing is fragile and depends on branch history shape.

## Decision
CLI-managed git tags named `beastmode/<slug>/<phase>`. Created at phase checkpoint, deleted on regression (downstream tags removed), renamed during slug rename via `store.rename()`. Crash-safe ordering: delete downstream tags -> git reset -> regress manifest. Old epics without tags fail with clear error. `beastmode/` namespace avoids user tag collision.

## Rationale
Git tags provide commit identification independent of message formatting or history shape. Crash-safe ordering ensures missing tags are harmless (next phase recreates them) while mid-operation crashes leave recoverable state. Tag rename maintains association through the slug-to-epic identity transition. Namespace isolation prevents collision with user workflow.

## Source
.beastmode/artifacts/design/2026-04-01-phase-rerun.md
.beastmode/artifacts/implement/2026-04-01-phase-rerun-phase-tags.md
