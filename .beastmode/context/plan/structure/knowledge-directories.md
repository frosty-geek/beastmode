# Knowledge Directories

## Context
The knowledge hierarchy needs a physical directory structure that maps cleanly to the four levels (L0/L1/L2/L3) and three domains (Context/Meta/State).

## Decision
`context/` for published knowledge (L1 summaries + L2 details + L3 records at `context/{phase}/{domain}/{record}.md`). `meta/` for self-improvement (L1 summaries + L2 SOPs/overrides/learnings). `state/` for checkpoint artifacts at `state/{phase}/YYYY-MM-DD-{feature}.md`. Write protection: phases write only to state/, retro promotes to context/ and meta/.

## Rationale
- Phase-based subdirectories mirror the five-phase workflow
- L3 records nest under their L2 parent for natural navigation
- Write protection prevents phases from bypassing retro quality gates
- Three-domain split separates what the project knows from how it works from what happened

## Source
state/plan/2026-03-06-context-write-protection.md
state/plan/2026-03-05-meta-hierarchy.md
