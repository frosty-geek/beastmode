# Express-Path Design

## Observation 1
### Context
During commit-issue-refs design, 2026-03-31
### Observation
User arrived with a pre-written PRD. The design skill's decision tree was skipped entirely — the session jumped directly to gray area identification. All three gray areas were selected and resolved in a single interview pass. One gray area caught an architectural violation (skills reading manifest directly, violating the manifest-unaware invariant) that would have been locked into the design without the sweep. The gray area sweep is the highest-value step when the user brings a finished PRD — it is the safety net that catches violations the user's solo design thinking missed.
### Rationale
When the user has already done design thinking, the skill's value shifts from "structured interview to discover the design" to "adversarial sweep to validate the design." The decision tree adds no value because the user has already walked it. The gray area sweep adds maximum value because it surfaces what the user's internal review did not. This suggests the design skill should recognize the express-path case and optimize for it — minimize ceremony, maximize gray area coverage.
### Source
.beastmode/artifacts/design/2026-03-31-commit-issue-refs.md
### Confidence
[LOW] — first-time observation; needs cross-session confirmation with other pre-written-PRD sessions
