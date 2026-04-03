---
phase: design
slug: remove-cost-tracking
epic: remove-cost-tracking
---

## Problem Statement

Cost tracking plumbing runs through the entire pipeline but always displays `$0.00` because non-SDK dispatch strategies (iTerm2, cmux) can't introspect cost data. Dead code that implies a working feature.

## Solution

Strip all cost-related fields, display logic, types, design docs, and configuration from the pipeline. The SDK's `SDKResultMessage.cost_usd` stays since it describes upstream data we receive, not something we built.

## User Stories

1. As a pipeline operator, I want the watch loop output to not show `$0.00` on every completion, so that the output only contains meaningful information.
2. As a developer, I want `SessionResult`, `PhaseResult`, and `CompletionEntry` to not carry dead `costUsd` fields, so that the type system reflects actual capabilities.
3. As a contributor, I want design docs and context files to not reference a removed feature, so that documentation reflects reality.
4. As a contributor, I want `.beastmode-runs.json` removed from `.gitignore`, so that there are no references to an unimplemented concept.

## Implementation Decisions

- Remove `costUsd` from `SessionResult` in `watch-types.ts`
- Remove `cost_usd` from `PhaseResult` in `types.ts`
- Remove `costUsd` from `CompletionEntry` in `sdk-message-mapper.ts`
- Remove cost capture logic from `watch-command.ts` (both SDK and CLI paths)
- Remove `$X.XX` formatting from watch loop completion listener in `watch.ts`
- Remove `costUsd: 0` hardcodes from `cmux-session.ts` and `it2-session.ts`
- Remove `cost_usd: null` from `interactive-runner.ts`
- Keep `cost_usd` on `SDKResultMessage` — it describes the upstream SDK data contract
- Delete `context/design/state-scanner/cost-separation.md`
- Delete `context/design/cli/cost-tracking.md` (if it exists as a standalone file)
- Remove cost references from `DESIGN.md` (line 86 CLI Architecture section, line 132 State Scanner section)
- Remove cost references from `context/design/cli.md`
- Remove deferred `beastmode costs` idea from old PRDs
- Remove `.beastmode-runs.json` from `.gitignore`

## Testing Decisions

- Grep for `costUsd`, `cost_usd`, `cost_Usd`, `costUSD`, `.beastmode-runs` across the entire codebase after removal to verify no references remain (excluding `SDKResultMessage`)
- TypeScript compilation must pass with no errors after field removal
- Watch loop output format verified by visual inspection of log line construction

## Out of Scope

- Replacing cost tracking with an alternative metric
- Any changes to the SDK message type definitions
- Adding new features to the watch loop output

## Further Notes

None

## Deferred Ideas

None
