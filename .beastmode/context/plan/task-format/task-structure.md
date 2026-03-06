# Task Structure

## Context
Implementation plans need a consistent task format that /implement can parse and execute.

## Decision
Each task has heading `### Task N: [Name]`, metadata fields (Wave, Depends-on, Parallel-safe), Files section with exact paths (Create/Modify/Test with optional line ranges), numbered steps with complete inline code, and a verification step with expected output. Plans include a header with Goal, Architecture, Tech Stack, and Design Doc link.

## Rationale
Complete inline code eliminates ambiguity during implementation. Exact file paths prevent agents from modifying wrong files. Verification steps enable automated spec-checking by the /implement controller.

## Source
state/plan/2026-03-04-plan-skill-improvements.md
state/plan/2026-03-04-implement-v2.md
