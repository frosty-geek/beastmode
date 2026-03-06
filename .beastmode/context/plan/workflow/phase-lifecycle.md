# Phase Lifecycle

## Context
The workflow needed a clear phase sequence with standalone utilities separated from core phases.

## Decision
Five-phase core workflow: design -> plan -> implement -> validate -> release. Each phase follows sub-phase anatomy: prime -> execute -> validate -> checkpoint. Standalone utilities: /beastmode (init), /status. Retro runs within each checkpoint sub-phase.

## Rationale
Five phases cover the full development lifecycle. Sub-phase anatomy ensures consistent structure within each phase. Retro embedded in checkpoints prevents knowledge loss between phases.

## Source
state/plan/2026-03-01-remove-verify-phase.md
state/plan/2026-03-01-skill-refactor.md
