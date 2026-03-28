## Context
Dispatched agents need visual organization that maps to the epic/feature mental model.

## Decision
One cmux workspace per active epic, one surface per dispatched phase or feature within the workspace. Agent commands sent via `surface.send-text` — cmux owns the shell process. Agents get full interactive terminal capability.

## Rationale
Workspace-per-epic maps naturally to the mental model: switching workspaces = switching epics. `surface.send-text` means agents get real terminals (better than SDK path where interactive input is impossible).

## Source
`.beastmode/state/design/2026-03-28-cmux-integration.md`
