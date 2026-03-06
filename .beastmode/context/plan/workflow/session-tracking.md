# Session Tracking

## Context
Claude sessions are ephemeral. Retro agents need access to session history for accurate review.

## Decision
Each phase appends to `.beastmode/status/YYYY-MM-DD-<feature>.md` on completion. Status files record executed phases, session file paths (absolute), and retro findings. Shared reference `skills/_shared/session-tracking.md` provides the template.

## Rationale
Recording session file paths enables retro agents to read conversation history for evidence-based review. Centralizing the template in _shared/ keeps all skills consistent.

## Source
state/plan/2026-03-01-session-tracking.md
state/plan/2026-03-01-retro-session-paths.md
