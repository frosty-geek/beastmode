# ARCHITECTURE - System Architecture

## Purpose

Documents the system design, component relationships, and data flow.

## Overview

Beastmode is a disciplined agentic workflow plugin for Claude Code that turns unstructured coding sessions into reproducible, multi-session engineering processes. It implements a seven-phase workflow (prime → research → design → plan → implement → verify → retro) where each phase produces artifacts that survive session boundaries, enabling knowledge compounds over time.

## Components

**Skills (Workflow Phases):**
- Purpose: Individual commands implementing workflow phases
- Location: `/skills/{phase-name}/SKILL.md`
- Dependencies: Each skill operates on `.agent/` artifacts from prior phases
- Key skills: prime (load context), research (explore domain), design (brainstorm specs), plan (create tasks), implement (execute plan), verify (validate work), retro (capture learnings)

**Prime Documentation (.agent/prime/):**
- Purpose: Reference material loaded every session with project context
- Location: `.agent/prime/{STACK,STRUCTURE,CONVENTIONS,ARCHITECTURE,TESTING}.md`
- Dependencies: Populated by bootstrap-discovery agents; updated by skills
- Pattern: Templates filled by discovery, maintained by developers

**Bootstrap System:**
- Purpose: Initialize project structure and populate prime docs
- Location: `/skills/bootstrap/`, `/skills/bootstrap-discovery/`, `/skills/bootstrap-wizard/`
- Dependencies: Runs once on new projects, uses discovery agents for codebase analysis
- Key component: `bootstrap-discovery` spawns 5 parallel Explore agents (STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING)

**Discovery Agents:**
- Purpose: Autonomous codebase analysis agents
- Location: `/agents/discovery.md` (subagent definitions)
- Dependencies: Called by bootstrap-discovery, returns markdown findings
- Pattern: Parallel execution with merge strategy (preserve/fill/update)

**Plugin Manifest:**
- Purpose: Registers workflow as Claude Code plugin
- Location: `/.claude-plugin/plugin.json`
- Dependencies: Loaded by Claude Code marketplace system

## Data Flow

```
User runs /prime
  ↓
Prime loads .agent/prime/*.md context
  ↓
User runs workflow phase (e.g., /design, /plan)
  ↓
Phase reads relevant artifacts and code
  ↓
Phase writes output to .agent/{folder}/ (design/, plan/, etc.)
  ↓
User commits artifacts to git
  ↓
Next session: /prime reloads context, continues work
  ↓
/implement orchestrates: setup worktree → prepare tasks → execute → complete (merge)
```

**Artifact persistence:** All phase outputs save to `.agent/{phase}/YYYY-MM-DD-{topic}.md`, enabling knowledge survival across sessions.

## Key Decisions

**Artifact-First Workflow:**
- Context: AI coding sessions are lossy; context disappears between sessions
- Decision: Every phase writes markdown artifacts to `.agent/` that persist in git
- Rationale: Enables multi-session projects, knowledge compounds automatically, clear state tracking

**Isolated Worktree Execution:**
- Context: Implementation can introduce breaking changes; need safety rails
- Decision: `/implement` creates isolated git worktree, merges back only on success
- Rationale: Prevents accidental main branch corruption, enables safe experimentation

**Parallel Discovery Agents:**
- Context: Bootstrap projects need comprehensive analysis; sequential analysis is slow
- Decision: `bootstrap-discovery` spawns 5 agents (STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING) in parallel
- Rationale: Dramatically faster initial documentation, each agent is specialized for its target

**Merge Strategy with Placeholders:**
- Context: Some documentation exists, some is templates; need intelligent merging
- Decision: Agents detect placeholder patterns `[e.g., ...]` and preserve/fill/update accordingly
- Rationale: Preserves real content while replacing template stubs

**Seven-Phase Workflow:**
- Context: Different coding tasks need different approaches; one process fits none
- Decision: Modular phases that can be skipped or chained: bootstrap → prime → research → design → plan → implement → verify → retro
- Rationale: "Quick fix? Skip to implement. Complex feature? Run every phase." Adapts to task complexity

## Boundaries

**External APIs:**
- Claude Code plugin system: Registers skills and agents
- Git: Source control backend for artifact persistence

**Internal Boundaries:**
- `.agent/` folder: Canonical artifact storage; all long-lived state lives here
- `skills/`: Workflow phase implementations; each phase is self-contained CLI command
- `agents/`: Subagent definitions for parallel analysis (discovery agents)
- `skills/{phase}/SKILL.md`: Single entry point per skill; defines behavior, prompts, validation

**Public Interfaces:**
- CLI commands (`/prime`, `/design`, `/plan`, `/implement`, etc.) — user entry points
- Artifact schema (markdown with headers, code blocks, structured sections)
- Prime documentation contract (`.agent/prime/*.md` structure)
- Markdown discovery findings (bootstrap-discovery output format)
