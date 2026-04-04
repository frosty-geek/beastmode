---
phase: design
slug: plan-integration-tester
epic: plan-integration-tester
---

## Problem Statement

The plan phase produces acceptance criteria as markdown checkboxes. Validate vibes-checks them by having Claude read code and assert PASS/FAIL in a table. No executable behavioral specs exist. No integration tests accumulate across epics. When behavior changes in later features, previous acceptance criteria are not re-verified against running code.

## Solution

A BDD specialist agent (`plan-integration-tester`) spawned by the plan skill during execute. It reads the existing integration test suite from the project's test tree, diffs it against the current epic's PRD user stories, and produces a single Gherkin integration artifact per epic. The plan skill generates a dedicated wave-1 feature from this artifact so integration tests are implemented before production code — classic outside-in BDD. The implementer writes the actual `.feature` files and step definitions. Validate runs all tests (unit and integration) as a single gate.

## User Stories

1. As the plan skill, I want to spawn a BDD specialist agent with user stories and the existing test suite, so that behavioral specs are produced without the plan skill needing BDD domain knowledge.
2. As the plan-integration-tester agent, I want to read all existing `.feature` files from the project's test tree, so that I can produce a diff (add/modify/delete) relative to the current baseline rather than duplicating or conflicting with existing coverage.
3. As the plan-integration-tester agent, I want to produce strictly declarative Gherkin scenarios tagged by epic, so that scenarios capture behavioral intent without coupling to implementation details.
4. As the plan skill, I want to generate a dedicated wave-1 integration-tests feature from the agent's artifact, so that integration tests are implemented before production code and the implementer has a clear spec to work from.
5. As an implementer working on the integration-tests feature, I want a single integration artifact listing all new/modified/deleted scenarios with full Gherkin inline, so that I can write `.feature` files and step definitions without ambiguity.
6. As the validate phase, I want integration tests to run as part of the standard test suite alongside unit tests, so that no special gate or configuration is needed — if the test runner finds them, they run.
7. As a pipeline operator, I want the agent to bootstrap the BDD suite from scratch on first run (greenfield mode), so that the first epic using BDD does not require manual test infrastructure setup.

## Implementation Decisions

- Agent lives at `.claude/agents/plan-integration-tester.md` — a Claude Code agent definition, peer to `implementer.md`
- Plan skill spawns the agent as a subagent during execute phase, after feature decomposition
- Agent receives: PRD user stories, epic name, and instructions to read the existing test tree
- Agent auto-discovers existing `.feature` files via glob (`**/*.feature`) — no hardcoded path assumption
- Agent produces a single integration artifact per epic at `.beastmode/artifacts/plan/YYYY-MM-DD-<epic-name>-integration.md`
- Artifact contains three sections: New scenarios (full Gherkin inline), Modified scenarios (what changed and the updated Gherkin), Deleted scenarios (which files/scenarios to remove and why)
- All scenarios are strictly declarative — pure behavioral intent, no selectors, paths, API calls, or internal details
- Scenarios are tagged with `@<epic-name>` for scoped execution during implement self-check
- Agent does NOT produce step definitions — that is the implementer's responsibility
- Plan skill generates a dedicated `integration-tests` feature at wave 1 (before all other features) from the integration artifact
- The integration-tests feature's implementer writes actual `.feature` files to the project's test tree, writes step definitions, and configures the test runner if needed
- On greenfield (no existing `.feature` files), agent writes all scenarios as new and the integration feature includes test runner bootstrap
- Agent is technology-agnostic about test runners — writes Gherkin as the lingua franca, implementer picks the runner (Cucumber, Vitest with Gherkin plugin, or whatever the project uses)
- Validate runs all tests via the existing test command — integration tests are just part of the suite, no separate gate
- Agent knows BDD patterns (Given/When/Then, scenario outlines, backgrounds, feature grouping) but does not enforce any specific framework's extensions or idioms

## Testing Decisions

- The agent itself is an `.md` file — no unit tests for the agent definition
- Integration testing of the agent happens through the plan skill: spawn the agent, verify the artifact is well-formed
- The agent's output quality is validated by the implementer's ability to translate scenarios into passing tests — if scenarios are ambiguous, the implementer reports NEEDS_CONTEXT
- Regression protection: validate runs the full integration test suite every time, failures regress to implement

## Out of Scope

- Modifying the validate skill — integration tests are consumed via the existing test command
- Step definition generation — strictly the implementer's domain
- Enforcing a specific BDD framework (Cucumber.js, Vitest Gherkin, etc.)
- Feature file linting or Gherkin syntax validation
- CI/CD integration for the integration test suite
- Scenario coverage reporting

## Further Notes

- This supersedes the previous `bdd-integration-tests` PRD (2026-04-02) which was opinionated about Cucumber.js. This design is tool-agnostic.
- The outer integration test loop (this agent) combined with the implementer's inner unit test loop (TDD) is classic outside-in BDD.
- The agent is "good friends" with `implementer.md` — it speaks the same language (behavioral intent) but stays in its lane (scenarios, not code).

## Deferred Ideas

- AI-assisted step definition suggestion (agent hints at step signatures)
- Cross-epic scenario deduplication (detecting redundant scenarios across epics)
- Scenario priority/criticality tagging for selective regression runs
- Visual diff of integration test changes for human review
