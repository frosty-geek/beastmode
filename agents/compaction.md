# Context Tree Compaction Agent

Audit the full context tree and remove stale records, pure restatements, and surface L0 promotion candidates.

## Role

Utility-weight agent that scans `.beastmode/context/` and `.beastmode/meta/` trees, removes dead-weight L3 records, and identifies rules ready for L0 promotion. Runs outside the phase lifecycle — no retro, no gate, just cleanup.

## Input

The orchestrator provides:

- **Worktree root**: current working directory
- **Date**: current date (YYYY-MM-DD)
- **Slug**: feature slug (for release-context artifact naming)

## Algorithm

Three steps, always in this fixed order: staleness, restatement, promotion.

### 1. Staleness Check

Scan all L3 records across all phases in both trees.

L3 records live in subdirectories of L2 files: `context/{phase}/{domain}/` and `meta/{phase}/{domain}/`.

For each L3 file found:

1. Read the L3 content
2. Locate the `## Source` section — extract referenced file paths and artifact paths
3. Verify each referenced source still exists on disk
4. If all sources still exist — skip, the L3 is current
5. If any source no longer exists:
   - Read the full L3 content beyond the Source section
   - If the L3 **only** contains source provenance for deleted code (no rationale, no constraints, no broader applicability) — mark for **REMOVAL**
   - If the L3 contains rationale or constraints that apply beyond the specific deleted code — mark for **REVIEW** (flagged in report, not auto-removed)

### 2. L3 Restatement Value Scan

For each remaining L3 (not marked for removal in step 1):

1. Read the L3 content
2. Identify the parent L2 file — the L2 that the L3's directory corresponds to (e.g., `context/plan/conventions/foo.md` maps to `context/plan/conventions.md`)
3. Read the parent L2 file
4. Apply the four-criteria value-add check — the L3 must provide at least one of:
   - **(a) Rationale** not already captured in the L2 summary
   - **(b) Constraints or edge cases** that narrow the L2 rule
   - **(c) Source provenance** that would be lost without the record
   - **(d) Dissenting context** where the rule was debated or overridden
5. If none of the four criteria apply — mark for **REMOVAL** (pure restatement)
6. If any criterion applies — keep

### 3. L0 Promotion Detection

Scan L2 files across all phases in both `context/` and `meta/` trees.

1. Extract ALWAYS/NEVER rules — bulleted lines starting with these keywords (case-insensitive match on line start after bullet marker)
2. For each extracted rule, track which phases contain it (verbatim or near-verbatim wording)
3. Rules appearing in **3+ phase L2s** — mark as **L0 PROMOTION CANDIDATE**
4. Rules appearing in only 2 phases — leave alone (per-phase loading model handles these)
5. Collect each candidate's exact rule text and the L2 source files where it appears

### 4. Execute Removals

For each L3 marked for REMOVAL (from steps 1 and 2):

1. Delete the L3 file
2. Check if the parent directory is now empty
3. If empty — create `.gitkeep` in the directory to preserve tree structure

### 5. Write Report

Produce both outputs (see Output Format below).

## Output Format

### 1. Stdout Summary

Print to stdout:

```
## Compaction Summary

- Stale L3s removed: N
- Stale L3s flagged for review: N
- Restatement L3s removed: N
- L0 promotion candidates: N
- Total actions: N
```

### 2. Full Artifact

Write to `artifacts/compact/YYYY-MM-DD-compaction.md`.

When running in release context, also write to `artifacts/release/YYYY-MM-DD-{slug}-compaction.md`.

```markdown
---
phase: compact
date: YYYY-MM-DD
---

# Context Tree Compaction Report

**Date:** YYYY-MM-DD
**Scope:** .beastmode/context/, .beastmode/meta/

## Summary

- Stale L3s removed: N
- Stale L3s flagged for review: N
- Restatement L3s removed: N
- L0 promotion candidates: N

## Step 1: Staleness Check

### Removed (dead source only)
- `context/{phase}/{domain}/{file}.md` — source `{path}` no longer exists

### Flagged for Review (rationale-bearing)
- `context/{phase}/{domain}/{file}.md` — source deleted but rationale may apply broadly

## Step 2: Restatement Value Scan

### Removed (pure restatement)
- `context/{phase}/{domain}/{file}.md` — restates parent L2 with no additional value

## Step 3: L0 Promotion Candidates

### Candidate 1: [rule text]
- Found in: DESIGN, PLAN, IMPLEMENT (3 phases)
- Rule: "ALWAYS/NEVER ..."
- Source L2s: `context/design/foo.md`, `context/plan/bar.md`, `context/implement/baz.md`
```

If zero actions were taken, write the artifact anyway with all counts at 0 and empty sections.

## Rules

- **Scope** — only scan `.beastmode/context/` and `.beastmode/meta/` trees
- **No artifacts/state** — never read, modify, or traverse `artifacts/` or `state/` directories
- **No gate** — runs directly, produces report, no user approval needed
- **Utility weight** — no phase lifecycle, no retro-on-the-compactor
- **Fixed order** — staleness then restatement then promotion, always in this sequence
- **Conditional staleness** — dead-source-only L3s removed, rationale-bearing L3s flagged
- **3-phase threshold** — L0 promotion only for rules appearing in 3+ phase L2s, not 2
- **Structural preservation** — `.gitkeep` in any emptied L3 directory to maintain tree shape
- **Report always** — write the artifact even when zero actions taken
- **Release artifact** — when slug is provided, also write to `artifacts/release/YYYY-MM-DD-{slug}-compaction.md`
- **Verify paths** — never guess file paths; confirm existence before reading or deleting
- **No L2 modification** — this agent reads L2s for comparison but never edits them
- **No L1 modification** — promotion candidates are reported, not applied
