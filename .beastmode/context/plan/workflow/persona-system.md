# Persona System

## Context
Beastmode needed consistent voice across workflow phases. Announce messages were hardcoded per skill.

## Decision
Centralized persona definition in `skills/_shared/persona.md` imported by all 0-prime.md files. Context-aware greetings factor in time of day and project state.

## Rationale
Single source of truth for character prevents drift across skills. @import ensures persona changes propagate everywhere. Context-aware greetings make the persona feel alive.

## Source
state/plan/2026-03-05-dynamic-persona-greetings.md
