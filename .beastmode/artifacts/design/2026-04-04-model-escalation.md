---
phase: design
slug: model-escalation
epic: model-escalation
---

## Problem Statement

Implementation agents always run on the default (most expensive) model regardless of task complexity. Simple tasks that haiku can handle cost the same as complex tasks that need opus. There's no mechanism to start cheap and scale up only when needed.

## Solution

Add a three-tier model escalation ladder (haiku -> sonnet -> opus) to the implementer agent dispatch in the implement skill. Each task starts at haiku. When the implementer hits a BLOCKED status or the quality reviewer returns NOT_APPROVED with Critical/Important issues, the controller escalates to the next model tier and retries. Escalation resets per task — each new task starts at haiku.

## User Stories

1. As a user running the implement phase, I want implementation agents to start on haiku so that simple tasks use the cheapest model available.

2. As a user whose implementer agent is BLOCKED, I want the controller to automatically retry with a more capable model (sonnet, then opus) so that I don't have to manually intervene on model-capability failures.

3. As a user whose quality review flags Critical/Important issues after the implementer's fix attempt, I want the controller to escalate the implementer's model tier so that code quality issues caused by model limitations get resolved by a more capable model.

4. As a user reviewing the implementation report, I want to see which model tier each task used so that I have visibility into escalation patterns across the feature.

## Implementation Decisions

- Three-tier escalation ladder: haiku -> sonnet -> opus. Hardcoded in the skill, not configurable via config.yaml.
- Escalation triggers: BLOCKED status from implementer, and Quality review NOT_APPROVED with Critical or Important severity issues. NEEDS_CONTEXT and Spec review FAIL do not trigger escalation — those are context/requirement issues, not model capability issues.
- Per-task reset: each new task starts at haiku regardless of what the previous task escalated to. No sticky escalation across tasks.
- Retry budget: 2 retries per model tier. If haiku fails twice, escalate to sonnet (2 retries). If sonnet fails twice, escalate to opus (2 retries). Maximum 6 total attempts per task before marking BLOCKED.
- Reviewers (spec-reviewer, quality-reviewer) stay on the default model. Only the implementer agent uses the escalation ladder.
- The implementation report logs the final model tier used per task in the completed tasks section (e.g., "Task 3: Implementer agent (sonnet) — clean").
- The controller tracks a `currentTier` variable per task that indexes into the ladder array `["haiku", "sonnet", "opus"]`.
- Escalation happens at the boundary between retry exhaustion and the next tier — not on every retry. Two failures at the same tier trigger escalation, not one.

## Testing Decisions

- Test the escalation logic by verifying the skill's dispatch instructions are unambiguous — the skill is markdown, not code, so testing means ensuring the controller behavior is clearly specified.
- Verify the Agent tool's `model` parameter accepts "haiku", "sonnet", and "opus" as valid values (these are the documented enum values).
- The implementation report format change (adding model tier) should be verified by inspection during the validate phase.

## Out of Scope

- Dashboard integration for model escalation visibility (deferred)
- Configurable escalation ladder via config.yaml
- Reviewer model escalation
- Wave-level or session-level adaptive model selection
- Cost tracking or cost comparison between tiers

## Further Notes

None

## Deferred Ideas

- Structured event emission for dashboard model-tier visibility — the dashboard could show which model tier each active agent is running on, and historical escalation patterns per epic.
- Configurable escalation ladder in config.yaml — if different projects have different cost/quality tradeoffs, the ladder and triggers could be config-driven.
- Adaptive wave-level model floor — if >50% of tasks in a wave escalated, bump the starting tier for the next wave.
