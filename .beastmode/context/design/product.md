# Product

## Vision

Turn Claude Code into a disciplined engineering partner through opinionated workflow patterns.

## Goals

- Structured phases (design -> plan -> implement -> validate -> release) with consistent sub-phase anatomy (prime -> execute -> validate -> checkpoint)
- Context persistence across sessions via `.beastmode/` artifact storage
- Self-improvement through meta layer — retro phases capture learnings that inform future sessions
- Progressive knowledge hierarchy — L0 system manual, L1 domain summaries, L2 full detail, L3 provenance

## Capabilities

- **Five-phase workflow**: Design -> plan -> implement -> validate -> release with 4-step sub-phase anatomy
- **Collaborative design**: Interactive gray area identification, multi-option proposals, and user approval gates
- **Bite-sized planning**: Design components decomposed into wave-ordered, file-isolated tasks with complete code
- **Parallel wave execution**: Tasks dispatched in parallel within waves when file isolation confirms no overlaps
- **Git worktree isolation**: Feature work in isolated worktrees, merged clean by /release
- **HITL gate configuration**: Two-tier gate system — HARD-GATE + configurable Gate steps (human/auto)
- **Brownfield discovery**: Auto-populate project context by spawning parallel exploration agents
- **Fractal knowledge hierarchy**: L0/L1/L2/L3 progressive loading with bottom-up retro compaction
- **Self-improving retro**: Phase checkpoints classify findings into SOPs, overrides, and learnings
- **Squash-per-release commits**: `git merge --squash` collapses feature branches into one commit on main
- **Release automation**: Version detection, commit categorization, changelog generation, marketplace publishing
- **Deadpan persona**: Centralized character definition with context-aware greetings

## How It Works

Each skill (/design, /plan, /implement, /validate, /release) follows four sub-phases: prime loads context, execute does the work, validate checks quality, checkpoint saves artifacts. Features flow through `.beastmode/state/` as they progress. Git worktrees provide isolation — created at /design, squash-merged by /release. The retro sub-phase compacts changes upward through the hierarchy.

## Key Differentiators

- **Progressive knowledge hierarchy**: Deterministic curated summaries, not probabilistic embedding retrieval. See `docs/progressive-hierarchy.md`.
- **Self-improving retro loop**: Phase checkpoints capture learnings that improve future sessions.
- **Structured workflow**: Design-before-code prevents wasted implementation.
- **Context persistence**: `.beastmode/` artifacts survive sessions via git. Just markdown files in your repo.
