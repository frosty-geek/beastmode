# Guidance Authority

## Context
Retro agents, sub-agents, and context reports were all independently printing next-step commands, causing 3x repetition and burying the actual transition instruction.

## Decision
Single authoritative source for next-step commands: the transition gate in the checkpoint phase only. Retro agents and context reports are explicitly banned from printing transition guidance. Context report is scoped to phase position and token usage only.

## Rationale
- Single authority eliminates competing guidance
- Retro ban is explicit because retro output naturally precedes the transition gate, making it the most visible source of duplication
- Context report separation keeps concerns clean: reporting vs. directing

## Source
state/design/2026-03-08-phase-end-guidance.md
