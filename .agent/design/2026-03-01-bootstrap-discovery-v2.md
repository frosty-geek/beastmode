# Design: bootstrap-discovery v2 — Parallel Agent Refactoring

**Date:** 2026-03-01
**Status:** Approved

## Summary

Refactor bootstrap-discovery to spawn 5 parallel Explore agents (one per analysis prime), remove human-in-the-loop approval, and implement merge/enhance strategy for idempotent re-runs.

## Context

The original bootstrap-discovery used a single Explore agent to analyze everything, then presented findings file-by-file with human approval (approve/edit/regenerate/skip). This was slow and required user interaction for each file.

**Inspiration:** [GSD Codebase Mapper](https://github.com/gsd-build/get-shit-done/blob/main/agents/gsd-codebase-mapper.md) — autonomous agent that explores codebases for specific focus areas and writes analysis documents directly.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent count | 5 parallel | One per analysis prime (STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING) |
| Excluded primes | META.md, AGENTS.md | Mostly static boilerplate |
| Execution model | All 5 in parallel | Maximum speed |
| Content strategy | Merge/enhance | Preserves valid content, fills gaps, updates stale info |
| Write responsibility | Coordinator | Agents return JSON, coordinator writes files |
| Agent model | Haiku | Fast, cost-effective for exploration |
| Human approval | Removed | Fully autonomous |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Coordinator                              │
│  1. Read existing prime files                                │
│  2. Spawn 5 agents in parallel                               │
│  3. Collect findings                                         │
│  4. Merge & write files                                      │
│  5. Update CLAUDE.md one-liners                              │
│  6. Commit changes                                           │
└─────────────────────────────────────────────────────────────┘
                          │
    ┌─────────┬───────────┼───────────┬───────────┐
    ▼         ▼           ▼           ▼           ▼
┌───────┐ ┌───────┐ ┌───────────┐ ┌────────────┐ ┌─────────┐
│ STACK │ │STRUCT │ │CONVENTIONS│ │ARCHITECTURE│ │ TESTING │
│ Agent │ │ Agent │ │   Agent   │ │   Agent    │ │  Agent  │
└───────┘ └───────┘ └───────────┘ └────────────┘ └─────────┘
```

## Agent Prompts

Each agent receives:
1. **Role** — what it's analyzing
2. **Exploration hints** — specific files/patterns to examine
3. **Current content** — existing prime file to merge with
4. **Output schema** — JSON format with action per section

### Exploration Hints by Agent

| Agent | Explore |
|-------|---------|
| STACK | `package.json`, `pyproject.toml`, `tsconfig.json`, lock files, CI/CD |
| STRUCTURE | Directory tree, entry points, import patterns |
| CONVENTIONS | Linter configs, 3-5 source samples, type definitions |
| ARCHITECTURE | README, docs/, entry point dependencies, module structure |
| TESTING | Test directories, test configs, 2-3 test file samples |

## Output Format

```json
{
  "prime": "STACK",
  "confidence": "high|medium|low",
  "sections": {
    "Section Name": {
      "action": "replace|merge|keep",
      "content": "markdown content"
    }
  },
  "sources": ["package.json", "tsconfig.json"]
}
```

## Merge Strategy

| Action | When | Behavior |
|--------|------|----------|
| `replace` | Section has only placeholders | Overwrite entirely |
| `merge` | Section has content + agent found more | Append new items |
| `keep` | Section accurate, no updates needed | Leave unchanged |

### Placeholder Detection

Patterns identified as placeholders:
- `[e.g., ...]`
- `[what it's used for]`
- `[command]`
- `<!-- Fill in ... -->`

## Error Handling

- Agent timeout → skip prime, preserve existing, log warning
- Malformed JSON → skip prime, preserve existing
- Empty response → preserve existing
- Low confidence → preserve existing, add comment with finding

## Files Changed

- `skills/bootstrap-discovery/SKILL.md` — refactored skill definition
- `skills/bootstrap-discovery/references/agent-prompts.md` — detailed prompts for 5 agents

## Next Steps

```
/plan .agent/design/2026-03-01-bootstrap-discovery-v2.md
```
