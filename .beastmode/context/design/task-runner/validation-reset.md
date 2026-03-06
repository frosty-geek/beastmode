# Validation Reset

## Context
When a validation step fails, the preceding work needs to be redone — not just the validation itself.

## Decision
Tasks whose title contains "Validate", "Approval", "Check", or "Verify" trigger auto-reset on failure: the previous sibling task and its children reset to pending. The validation task itself also resets.

## Rationale
- Resetting the previous sibling forces a redo of the work that failed validation
- Keyword-based detection avoids manual annotation of validation steps
- Auto-reset prevents the system from getting stuck on validation failures

## Source
state/design/2026-03-04-task-runner.md
