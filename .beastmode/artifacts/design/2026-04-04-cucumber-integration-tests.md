---
phase: design
slug: cucumber-integration-tests
epic: cucumber-integration-tests
problem: Seven integration risk areas have zero or mock-only e2e coverage
solution: 16 new cucumber feature files in 3 priority tiers extending existing infrastructure
---

## Problem Statement

Beastmode's 67 unit tests cover individual modules with heavy mocking, and 2 cucumber features cover happy paths only. Seven integration risk areas have zero or mock-only e2e coverage: cancel flow (mocked git/gh), regression loop (XState only), GitHub sync (100% mocked), HITL hooks (file I/O only), wave failure (completely untested), design slug rename (mocked store.rename), and pipeline error resilience (individual paths only).

## Solution

Extend the existing cucumber infrastructure (`cli/features/`) with 16 new feature files organized in 3 priority tiers (6 P0, 5 P1, 5 P2). Follow the established pattern: mock the dispatch/session boundary, run everything else for real (git, manifest store, XState, artifact I/O, HITL settings).

## User Stories

1. As a beastmode developer, I want cucumber tests exercising failure paths and edge cases, so that refactoring the pipeline runner or watch loop does not silently break cancel, regression, wave ordering, or slug rename.
2. As a CI pipeline, I want cucumber tests that run in under 60 seconds without network access, so that every PR gets integration coverage.
3. As a contributor, I want each .feature file to be self-contained and readable, so that I can understand expected behavior by reading the feature.

## Implementation Decisions

### World Classes

| World Class | Purpose | Real | Mocked |
|---|---|---|---|
| `PipelineWorld` (existing) | Single-epic pipeline | git, manifest, artifacts, XState, HITL | dispatch |
| `WatchLoopWorld` (existing) | Watch loop orchestration | tracker, events, serialization | scanEpics, SessionFactory |
| `CancelWorld` (new) | Cancel/abandon flow | git, manifest, artifacts, tags | gh CLI |
| `GitHubSyncWorld` (new) | GitHub sync | manifest, body formatting | gh CLI (stubbed) |

Most P0 features extend `PipelineWorld` with helpers (e.g., `runPipelineWithFailure` for error injection). Cancel flow needs its own world (different entry point: `cancelEpic` vs `run`).

### File Organization

```
cli/features/
  pipeline-happy-path.feature      # existing
  watch-loop-happy-path.feature    # existing
  cancel-flow.feature              # P0
  regression-loop.feature          # P0
  wave-failure.feature             # P0
  design-slug-rename.feature       # P0
  pipeline-error-resilience.feature # P0
  hitl-hook-lifecycle.feature      # P0
  multi-epic-failure.feature       # P1
  github-sync.feature              # P1
  release-end-to-end.feature       # P1
  watch-lockfile.feature           # P1
  manifest-rename.feature          # P1
  dispatch-race.feature            # P2
  artifact-isolation.feature       # P2
  impl-branch-isolation.feature    # P2
  phase-rerun.feature              # P2
  reconcile-startup.feature        # P2
  step_definitions/
    shared.steps.ts                # reusable Given/Then
    cancel.steps.ts
    regression.steps.ts
    ...
  support/
    cancel-world.ts                # new
    cancel-hooks.ts                # new
    github-sync-world.ts           # new
    github-sync-hooks.ts           # new
```

### Mock Boundary

| Component | Real/Mock | Rationale |
|---|---|---|
| Git operations | Real | Core integration surface |
| Manifest store (JSON) | Real | File I/O is the seam |
| XState reconciliation | Real | State machine correctness |
| Artifact I/O | Real | Parser bugs hide when mocked |
| HITL settings | Real | File write/read cycle |
| Dispatch (Claude session) | Mock | Can't run AI in tests |
| SessionFactory | Mock | Can't run SDK sessions |
| GitHub gh CLI | Mock | Stubbed responses |
| Process spawning | Mock | Can't create terminals |

### Cucumber Profiles

- `default`: pipeline happy path (existing)
- `watch`: watch loop (existing)
- `cancel`: cancel flow
- `p0`: all P0 features
- `p1`: all P1 features
- `all`: everything

### Implementation Order

1. Feature 2: Regression Loop (builds error injection pattern)
2. Feature 4: Design Slug Rename (rename assertions)
3. Feature 5: Pipeline Error Resilience (error-injecting overrides)
4. Feature 6: HITL Hook Lifecycle (settings.local.json assertions)
5. Feature 1: Cancel Flow (creates CancelWorld)
6. Feature 3: Wave Failure (extends WatchLoopWorld)
7. P1: 7, 9, 10, 11, 8
8. P2: any order

## Testing Decisions

```bash
bun --bun node_modules/.bin/cucumber-js --profile all    # everything
bun --bun node_modules/.bin/cucumber-js --profile p0     # must-haves
```

P0 must pass on every PR. P1/P2 advisory initially. Each feature < 5 seconds. Total suite < 60 seconds.

## Out of Scope

1. Skill-level testing (banner, context report, retro, design interview)
2. Real GitHub API (use stubbed gh CLI)
3. Real Claude sessions (dispatch always mocked)
4. Visual/rendering (covered by ink-testing-library)
5. Performance testing (correctness only)
6. Dispatch strategy integration (requires real processes)

## Feature Set

### P0: Must Have

**Feature 1: Cancel and Abandon Flow** — 6-step cleanup against real git repo
**Feature 2: Validate Failure and Regression Loop** — validate -> regress -> re-implement -> release
**Feature 3: Wave Ordering with Failure** — wave 1 failure blocks wave 2
**Feature 4: Design Slug Rename End-to-End** — hex slug -> readable name atomically
**Feature 5: Pipeline Error Resilience** — transient errors don't abort pipeline
**Feature 6: HITL Hook Lifecycle** — settings written/cleaned per dispatch

### P1: Should Have

**Feature 7: Multi-Epic Watch Loop with Failure** — one fails, one proceeds
**Feature 8: GitHub Sync Integration** — issues, labels, sub-issues, closing comments
**Feature 9: Release Phase End-to-End** — archive, cleanup, done state
**Feature 10: Watch Loop Startup and Lockfile** — acquire, prevent, detect stale, release
**Feature 11: Manifest Store Rename Integration** — atomic rename with rollback

### P2: Nice to Have

**Feature 12: Dispatch Race Prevention** — reservation-based dedup
**Feature 13: Generate-Output Artifact Isolation** — stale artifact exclusion
**Feature 14: Implement Fan-Out Branch Isolation** — `impl/<slug>--<feature>` branches
**Feature 15: Phase Rerun (Manual Regression)** — reset to predecessor tag
**Feature 16: Reconcile All at Startup** — catch-up on restart
