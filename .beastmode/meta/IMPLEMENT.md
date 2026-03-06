# Implement Meta

Learnings from implementation phases. Key pattern: markdown-only plans with file-isolated waves execute cleanly in parallel with zero deviations when the plan accurately captures file boundaries.

## Defaults

<!-- From plugin -->

## Project Overrides

<!-- User additions -->

## Learnings

### 2026-03-04: hitl-gate-config
- **File-isolated waves enable reliable parallel dispatch** (2026-03-04): When the plan accurately separates files across tasks within a wave, parallel agent dispatch works perfectly. All 4 waves in this session completed with 0 deviations. The /plan file isolation analysis (Wave 2 tasks each touching different skill directories) was the key enabler.
- **Annotation tasks are ideal for parallel subagents** (2026-03-04): Tasks that insert content at known locations in existing files (like HITL-GATE annotations) are predictable enough for subagents to execute without controller intervention. The pattern: give exact surrounding context + exact content to insert = reliable results.
