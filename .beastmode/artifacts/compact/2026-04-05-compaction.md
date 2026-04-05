---
phase: compact
date: 2026-04-05
---

# Context Tree Compaction Report

## Staleness Check

### Removed
- `design/dashboard/message-mapper.md` — source provenance for deleted module (SDKMessage/message mapper removed in spring-cleaning); replacement (FallbackEntryStore) documented elsewhere
- `implement/state-scanning/status-display.md` — references nonexistent `status-data.ts`; content also pure restatement of parent L2

### Flagged for Review

#### Design Phase
- `design/dashboard/ring-buffer.md` — RingBuffer class no longer exists; contains "always-collecting" design rationale that may still apply to current data flow
- `design/dashboard/shared-data-module.md` — `status-data.ts` no longer exists; contains data/presentation separation rationale with architectural value
- `design/dashboard/overview-panel.md` — states DetailsPanel "entirely replaced" but DetailsPanel still exists alongside OverviewPanel; decision may be partially stale

#### Plan Phase
- `plan/github-integration/manifest-redesign.md` — references `manifest-store.ts`/`manifest.ts` module split (now `cli/src/store/`); contains rationale about gitignored manifests and single-mutator architecture
- `plan/github-integration/state-authority-model.md` — references stale module names; core principle (manifest=authority, GitHub=mirror) still active
- `plan/github-integration/dispatch-pipeline.md` — references stale `manifest.ts` module split; post-dispatch hook pattern still exists
- `plan/github-integration/skill-cleanup.md` — references deleted `skills/_shared/github.md`; skill-as-pure-artifact-producer rationale still applies
- `plan/github-integration/setup-subcommand.md` — routing reference may be stale; contains idempotent setup rationale

#### Implement Phase
- `implement/github-integration/body-enrichment.md` — references `section-extractor.ts`, `section-splitter.ts`, `artifact-reader.ts` (absorbed into `github/sync.ts`); contains presence-based rendering and progressive enrichment rationale

#### Validate Phase
- `validate/validation-patterns/migration-reconciler-gap.md` — migration-specific lesson (manifest-absorption epic); broader applicability for pipeline lifecycle testing of reconciler patterns

## Restatement Scan

### Removed

#### Design Phase (18)
- `design/cli/command-structure.md` — restates L2 `cli.md` Command Structure section
- `design/cli/configuration.md` — restates L2 `cli.md` Configuration section
- `design/cli/worktree-lifecycle.md` — restates L2 `cli.md` Worktree Lifecycle section; rebase detail also in `cli/post-dispatch-pipeline.md`
- `design/compaction/compaction-agent.md` — restates L2 `compaction.md` Compaction Agent section
- `design/compaction/reporting.md` — restates L2 `compaction.md` Reporting section
- `design/compaction/trigger-and-scheduling.md` — restates L2 `compaction.md` Trigger and Scheduling section
- `design/dashboard/watch-loop-integration.md` — restates L2 `dashboard.md` Watch Loop Integration section
- `design/dashboard/sdk-dispatch-override.md` — restates L2 `dashboard.md` Dispatch section
- `design/github-state-model/configuration.md` — restates L2 `github-state-model.md` Configuration section
- `design/github-state-model/epic-state-machine.md` — restates L2 `github-state-model.md` Epic State Machine section
- `design/github-state-model/error-handling.md` — restates L2 `github-state-model.md` Error Handling section
- `design/github-state-model/setup.md` — restates L2 `github-state-model.md` Setup section
- `design/orchestration/recovery.md` — restates L2 `orchestration.md` Recovery section
- `design/state-scanner/phase-source-of-truth.md` — restates L2 `state-scanner.md` Phase Source of Truth section
- `design/state-scanner/scanner-architecture.md` — restates L2 `state-scanner.md` Scanner Architecture section
- `design/state-scanner/type-architecture.md` — restates L2 `state-scanner.md` Type Architecture section
- `design/tech-stack/development.md` — restates L2 `tech-stack.md` Development section
- `design/tech-stack/platform.md` — restates L2 `tech-stack.md` Platform section

#### Plan Phase (6)
- `plan/github-integration/label-taxonomy.md` — restates L2 `github-integration.md` Label Taxonomy section
- `plan/workflow/parallel-execution.md` — restates L2 `workflow.md` Parallel Execution section
- `plan/workflow/phase-lifecycle.md` — restates L2 `workflow.md` Phase Lifecycle section
- `plan/structure/core-directories.md` — restates L2 `structure.md` Core Directories section
- `plan/structure/entry-points.md` — restates L2 `structure.md` Entry Points section
- `plan/structure/knowledge-directories.md` — restates L2 `structure.md` Knowledge Directories section

#### Implement Phase (6)
- `implement/github-integration/label-taxonomy.md` — restates L2 `github-integration.md` Label Taxonomy section
- `implement/pipeline-machine/actor-lifecycle.md` — restates L2 `pipeline-machine.md` Actor Lifecycle section
- `implement/pipeline-machine/dispatch-metadata.md` — restates L2 `pipeline-machine.md` Dispatch Metadata section
- `implement/pipeline-machine/guards.md` — restates L2 `pipeline-machine.md` Guards section
- `implement/pipeline-machine/service-injection.md` — restates L2 `pipeline-machine.md` Service Injection section
- `implement/testing/brownfield-verification.md` — restates L2 `testing.md` Brownfield Verification section

#### Release Phase (6)
- `release/changelog/commit-categorization.md` — restates L2 `changelog.md` categorization rules
- `release/changelog/consolidated-changelog.md` — restates L2 `changelog.md` consolidation rules
- `release/changelog/release-artifact-format.md` — restates L2 `changelog.md` format specification
- `release/release-process/merge-strategy.md` — restates L2 `release-process.md` squash merge rules
- `release/versioning/commit-format.md` — restates L2 `versioning.md` commit format rules
- `release/versioning/version-detection.md` — restates L2 `versioning.md` version source rules

#### Validate Phase (4)
- `validate/quality-gates/gate-behavior.md` — restates L2 `quality-gates.md` partial pass rules
- `validate/quality-gates/manual-verification.md` — restates L2 `quality-gates.md` manual verification rules
- `validate/validation-patterns/evidence-standards.md` — restates L2 `validation-patterns.md` evidence rules
- `validate/validation-patterns/report-structure.md` — restates L2 `validation-patterns.md` report skeleton

## L0 Promotion Candidates

1. **"ALWAYS archive feature branch tip before squash merge/deletion"** — found in: design (`architecture.md`, `release-workflow.md`), plan (`workflow.md`), release (`versioning.md`, `RELEASE.md`)
2. **"Skills are pure artifact producers — NEVER make skills GitHub-aware or manifest-aware"** — found in: design (`github-state-model.md`), plan (`github-integration.md`), implement (`github-integration.md`)
3. **"ALWAYS use squash merge for releases (one commit per version on main)"** — found in: design (`architecture.md`), plan (`workflow.md`), release (`release-process.md`, `RELEASE.md`)

## Structural Changes

Directories emptied by removals (`.gitkeep` added):
- `design/tech-stack/`
- `plan/structure/`
- `implement/state-scanning/`
- `release/changelog/`

## Summary

- Stale removed: 2
- Stale flagged: 10
- Restatements removed: 40
- Promotion candidates: 3
- Total files removed: 42
