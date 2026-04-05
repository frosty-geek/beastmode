---
phase: plan
slug: spring-cleaning
epic: spring-cleaning
feature: integration-tests
wave: 1
---

# Integration Tests

**Design:** `.beastmode/artifacts/design/2026-04-05-spring-cleaning.md`

## User Stories

1. As a developer, I want cmux dispatch code removed, so that the codebase only contains actively-used dispatch strategies.
2. As a developer, I want SDK dispatch logic (SdkSessionFactory, dispatchPhase, SDK streaming infrastructure) removed, so that dispatch is exclusively iTerm2-based.
3. As a developer, I want `beastmode watch` and `beastmode status` CLI commands removed, so that the dashboard is the sole pipeline UI entry point.
4. As a developer, I want the `dispatch-strategy` config key and `cmux` config section removed, so that configuration reflects the actual capability set.
5. As a developer, I want SDK streaming types (RingBuffer, SessionEmitter, LogEntry, SdkContentBlock) removed from factory.ts, so that the dispatch module only contains iTerm2-relevant abstractions.
6. As a developer, I want DispatchedSession and SessionHandle types stripped of the `events` field, so that session types reflect iTerm2-only dispatch.
7. As a developer, I want design docs, context tree entries, and L2/L3 knowledge updated to reflect the simplified architecture, so that project knowledge stays accurate.
8. As a developer, I want dead test files identified and removed on a case-by-case basis, so that the test suite only covers living code.

## What to Build

Write BDD `.feature` files and step definitions for the spring-cleaning epic's integration scenarios as specified in the integration artifact at `.beastmode/artifacts/plan/2026-04-05-spring-cleaning-integration.md`.

**New feature files** covering:
- cmux dispatch strategy unavailability (US 1)
- SDK dispatch strategy unavailability (US 2)
- watch/status CLI command removal (US 3)
- config key rejection for removed keys (US 4)
- dispatch module type exports (US 5)
- session type field removal (US 6)
- documentation accuracy (US 7)
- dead test file removal verification (US 8)

**Modified feature files:**
- `dashboard-dispatch-strategy.feature` — remove cmux/SDK from strategy examples, simplify to iTerm2-only
- `dashboard-event-log-panel.feature` — remove SDK streaming preconditions

**Deleted feature files:**
- `dashboard-unified-strategy.feature` — premise (watch/dashboard parity) is obsolete

Step definitions should use structural assertions (grep for imports, check type exports) rather than runtime assertions where appropriate, since this is a deletion-verification epic.

## Acceptance Criteria

- [ ] New `.feature` files created for each user story's integration scenarios (20 scenarios total)
- [ ] `dashboard-dispatch-strategy.feature` updated to iTerm2-only
- [ ] `dashboard-event-log-panel.feature` updated to remove SDK streaming preconditions
- [ ] `dashboard-unified-strategy.feature` deleted
- [ ] Step definitions compile and are wired to the Gherkin scenarios
- [ ] Test runner configuration includes the new feature files
