# ARCHITECTURE - System Architecture

## Purpose

Documents the system design, component relationships, and data flow.

## Overview

Beastmode is a workflow system that turns Claude Code into a disciplined engineering partner through opinionated workflow patterns. It provides a structured five-phase workflow (design → plan → implement → validate → release) with standalone utilities (/bootstrap, /research, /status, /prime, /retro) that scales from quick fixes to deep feature work, enabling Claude agents to systematically design and implement features while maintaining comprehensive project context across sessions through `.beastmode/` artifact storage.

## Knowledge Architecture

### L0/L1/L2 Hierarchy

- **L0**: Top-level files (PRODUCT.md) — Product vision
- **L1**: Phase summaries (UPPERCASE.md) — Always loaded by /prime
- **L2**: Detail files (lowercase/) — Loaded on-demand via @imports

### Four Data Domains

| Domain | Purpose | Location |
|--------|---------|----------|
| **Product** | What we're building | `.beastmode/PRODUCT.md` |
| **State** | Where features are in workflow (kanban) | `.beastmode/state/` |
| **Context** | How to build (architecture, conventions, testing) | `.beastmode/context/` |
| **Meta** | How to improve (learnings, overrides) | `.beastmode/meta/` |

## Components

**Skills (Workflow Verbs):**
- Purpose: Individual commands that execute specific workflow phases
- Location: `/skills/`
- Dependencies: Reference templates, Common instructions, .beastmode/ infrastructure

**Commands (Interface Definitions):**
- Purpose: Define what each phase command reads, writes, and does
- Location: `/commands/`
- Contains: design.md, plan.md, implement.md, validate.md, release.md

**Bootstrap Skill:**
- Purpose: Initialize a new project with .beastmode/ folder structure
- Location: `/skills/bootstrap/`
- Dependencies: Templates in `/skills/bootstrap/templates/`, CLAUDE.md bridge

**Prime Skill:**
- Purpose: Load curated beastmode context for fast session initialization; reads `.beastmode/` L0/L1 files
- Location: `/skills/prime/`
- Dependencies: Bootstrapped beastmode project (.beastmode/ directory), project context

**Bootstrap Discovery Skill:**
- Purpose: Autonomous parallel codebase analysis with 5 parallel Explore agents to auto-populate context files
- Location: `/skills/bootstrap-discovery/`
- Dependencies: Five agent prompt templates, common instructions, .beastmode/context/ directory

**Research Skill:**
- Purpose: Conduct domain exploration and discovery
- Location: `/skills/research/`
- Dependencies: Project context

**Design Skill:**
- Purpose: Brainstorm and create design specs through collaborative dialogue with user approval gates
- Location: `/skills/design/`
- Dependencies: Project context, user interaction

**Phase Research (Optional):**
- Purpose: Discover unknowns before design or plan phases via keyword/complexity triggers
- Location: `skills/design/phases/0-research.md`, `skills/plan/phases/0-research.md`
- Dependencies: `agents/researcher.md`, Context7/WebFetch/WebSearch (tool priority), .beastmode/context/ docs

**Plan Skill:**
- Purpose: Convert designs into bite-sized implementation tasks with comprehensive documentation
- Location: `/skills/plan/`
- Dependencies: Design docs, project structure, testing infrastructure

**Implement Skill:**
- Purpose: Execute implementation plans in isolated git worktrees with clean merge on completion
- Location: `/skills/implement/`
- Dependencies: Git, npm/package manager, task tracking, test runner

**Validate Skill:**
- Purpose: Quality gate before release — runs tests, lint, type checks, and custom gates
- Location: `/skills/validate/`
- Dependencies: Test runner, linter, type checker (project-specific)

**Status Skill:**
- Purpose: Track current project state and milestones
- Location: `/skills/status/`
- Dependencies: .beastmode/state/ directory

**Release Skill:**
- Purpose: Create changelogs, stage unified cycle changes, commit, merge to main, and cleanup worktree
- Location: `/skills/release/`
- Dependencies: Git, .beastmode/ artifacts, plan/implement/retro outputs, status file with worktree info

**Retro Skill:**
- Purpose: Analyze session work to improve agent instructions through parallel review
- Location: `/skills/retro/`
- Dependencies: Session artifacts (.beastmode/state/ markdown + session JSONL files), agent instruction files, design/plan docs for architectural decisions

**Agents:**
- Purpose: Subagents spawned for specialized tasks (discovery, research)
- Location: `/agents/`
- Contains: discovery.md (codebase analysis), researcher.md (phase research with verification protocol)
- Dependencies: Skill prompts, project codebase

**.beastmode/ Infrastructure:**
- Purpose: Central context storage that persists across sessions
- Location: `/.beastmode/`
- Contains: PRODUCT.md (L0), state/, context/, meta/ (L1/L2)
- Dependencies: None (root structure)

## Data Flow

```
User workflow intent
  ↓
Skill execution (design creates cycle worktree)
  ↓
Status file updated with worktree path
  ↓
Subsequent phases (plan, implement, validate, retro) inherit worktree from status
  ↓
Each phase: cd into worktree → execute → write artifacts (NO commit)
  ↓
Release: stage all → single commit → merge → cleanup worktree
  ↓
.beastmode/ artifacts + code changes persist on main
```

Feature state flows through `.beastmode/state/` directories:
```
state/design/20260303-login-form.md
  → state/plan/20260303-login-form.md
  → state/implement/20260303-login-form.md
  → state/validate/20260303-login-form.md
  → state/release/20260303-login-form.md
```

For Retro specifically:
```
.beastmode/state/ (with Session Files section)
  ↓
Gather phase collects session JSONL paths
  ↓
Review agents receive paths in prompts
  ↓
Agents read JSONL conversations for context
  ↓
Findings include conversation-informed recommendations
  ↓
Apply phase updates .beastmode/meta/
```

## Key Decisions

**Five-Phase Workflow:**
- Context: Need to support both quick fixes and deep features without overhead
- Decision: Linear workflow (design → plan → implement → validate → release) with standalone utilities (/bootstrap, /research, /status, /prime, /retro)
- Rationale: Matches real engineering practices; design-before-code prevents wasted implementation; validate ensures quality before release; retro captures learnings

**L0/L1/L2 Hierarchical Loading:**
- Context: Need to balance comprehensive context with token efficiency
- Decision: Three-level hierarchy — L0 (product vision), L1 (phase summaries always loaded), L2 (details on-demand)
- Rationale: L1 summaries provide enough context for most tasks; L2 details loaded only when needed

**Four Data Domains (Product/State/Context/Meta):**
- Context: Different types of information have different lifecycles and purposes
- Decision: Separate product vision, feature state (kanban), build context, and self-improvement into distinct domains
- Rationale: Clear separation enables focused updates; state as kanban maps to feature workflow; meta enables continuous improvement

**Artifact-Based Context Persistence:**
- Context: Multi-session work requires context to survive between Claude Code sessions
- Decision: Store all phase outputs in .beastmode/ as markdown files that are version-controlled
- Rationale: Git provides durability and history; markdown is human-readable; .beastmode/ is always loaded by /prime skill

**Commands as Interface Layer:**
- Context: Need clear definition of what each phase reads, writes, and does
- Decision: `commands/*.md` files define phase interfaces separate from skill implementation
- Rationale: Interface definitions visible at root; skills implement the interfaces; clear contract between phases

**Parallel Discovery Agents:**
- Context: Initial codebase analysis is expensive; want comprehensive findings without sequential wait time
- Decision: bootstrap-discovery spawns 5 independent Explore agents in parallel (one per prime target: STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING)
- Rationale: Haiku model is fast enough; parallel execution saves session time; agents merge findings with existing content

**Isolated Implementation Worktrees:**
- Context: Implement skill needs to execute complex plans without disrupting main branch or other agents
- Decision: Create isolated git worktrees in .beastmode/worktrees/ for execution, merge back on completion
- Rationale: Git worktrees provide branch isolation; enables concurrent work; clean merge on success

**Unified Cycle Commit Architecture:**
- Context: Multiple phase-specific commits per feature cycle create noise; worktree isolation enables consolidation
- Decision: Design creates worktree, all phases write artifacts without committing, Release owns single commit + merge + cleanup
- Rationale: Reduces commit noise; maintains WIP safety via worktree isolation; clear endpoint for merge/cleanup logic; single commit simplifies history

**CLAUDE.md Imports from .beastmode/:**
- Context: Need minimal project brain in root while keeping comprehensive docs organized
- Decision: Root CLAUDE.md imports @.beastmode/PRODUCT.md and @.beastmode/context/*.md
- Rationale: Clear precedent for project context; @imports reduce duplication; context files loaded hierarchically

**Session JSONL Access for Retro Inspection:**
- Context: Retro agents need access to actual conversation history, not just markdown summaries
- Decision: Store absolute paths to session JSONL files in status markdown under "Session Files" section; agents read files directly
- Rationale: Raw conversation context enables agents to identify patterns and provide informed recommendations

## Boundaries

**External APIs:**
- Claude Code / Claude Agent SDK: Provides skill execution environment and subagent spawning
- Git: Version control and worktree isolation for implementation
- NPM / Package managers: Dependency installation and task running

**Internal Boundaries:**
- Skill boundary: Each verb (design, plan, implement, validate, release) is isolated in `/skills/{verb}/`
- Agent boundary: Subagents are spawned for specific tasks and exit after completion
- Context boundary: .beastmode/ folder is the single source of truth for project context across sessions
- Domain boundary: Product, State, Context, Meta are separate concerns with distinct update patterns
- Phase boundary: Each workflow phase produces artifacts consumed by the next phase (design → plan → implement → validate → release)

**Public Interfaces:**
- Skill commands (e.g., `/prime`, `/design`, `/plan`, `/implement`, `/validate`, `/release`)
- Command definitions (`commands/*.md`) — phase interface contracts
- .beastmode/ folder structure (user-facing artifact storage)
- @import syntax for CLAUDE.md (documentation composition)
- Root CLAUDE.md (entry point for project brain)
