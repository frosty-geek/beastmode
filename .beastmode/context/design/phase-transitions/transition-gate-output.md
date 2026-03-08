# Transition Gate Output

## Context
Phase checkpoint transition gates produced inconsistent output. Next-step commands appeared 3x (from retro, context report, and transition gate). No standardized format existed for the copy-pasteable command.

## Decision
Standardized output format: single inline code with resolved artifact path. Both human and auto modes print the same command. Auto mode additionally attempts the Skill call. Command format: `/beastmode:<next-phase> .beastmode/state/<phase>/YYYY-MM-DD-<feature>.md`. STOP after printing.

## Rationale
- Single source eliminates duplicate guidance observed in field testing
- Inline code (backtick-wrapped) is the minimal copy-pasteable format
- STOP instruction prevents additional output that buries the command
- Consistent format across all five phases reduces cognitive load
- Same output in human and auto modes ensures the human always has the command when auto-chaining is unreliable

## Source
state/design/2026-03-08-phase-end-guidance.md
