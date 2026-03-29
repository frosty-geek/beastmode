---
phase: plan
epic: handoff-v2
feature: validate-stop
slug: handoff-v2-validate-stop
status: completed
---

# Validate STOP

**Design:** .beastmode/artifacts/design/2026-03-29-handoff-v2.md

## User Stories

2. As the watch loop, I want every phase to end with STOP so that session termination is unambiguous and the Stop hook fires consistently.

## What to Build

Normalize the validate checkpoint's FAIL-path STOP text. Currently the FAIL path uses `STOP — do not proceed to commit` while the PASS path uses `STOP. No additional output.`. Change the FAIL path to also use `STOP. No additional output.` — the semantic difference (no commit, no artifact on failure) is structural, not textual.

## Acceptance Criteria

- [ ] Validate FAIL path ends with `STOP. No additional output.` instead of `STOP — do not proceed to commit`
- [ ] Both PASS and FAIL paths use identical STOP text
