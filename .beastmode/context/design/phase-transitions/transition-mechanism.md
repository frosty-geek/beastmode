# Transition Mechanism

## Context
Phases need to chain to the next phase automatically when configured for autonomous operation.

## Decision
When a transition gate is set to `auto`, Claude calls `Skill(skill="beastmode:<next>", args="<artifact-path>")` with fully-qualified skill names. Each transition passes the feature's state file path as the artifact argument.

## Rationale
- Fully-qualified names prevent ambiguity with other plugins
- Artifact path passing ensures the next phase knows what feature to continue
- Direct Skill tool call is simpler than indirect invocation methods

## Source
state/design/2026-03-04-fix-auto-transitions.md
