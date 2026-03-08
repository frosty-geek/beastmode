---
name: beastmode
description: Project initialization, status, and idea tracking. Use when starting a new project, checking project state, or reviewing deferred ideas.
---

# /beastmode

Unified command for project management.

## Subcommands

- `init` — Discover project knowledge and populate context hierarchy
- `status` — Show features grouped by workflow phase
- `ideas` — Surface and reconcile deferred ideas from design docs

## Routing

### 1. Parse Arguments

Extract subcommand from arguments:
- If args start with "init" → route to `@subcommands/init.md`
- If args start with "status" → route to `@subcommands/status.md`
- If args start with "ideas" → route to `@subcommands/ideas.md`
- If no args or unrecognized → show help

### 2. Show Help (default)

If no recognized subcommand:

```
Usage: /beastmode <subcommand>

Subcommands:
  init          Discover project knowledge and populate context hierarchy
  status        Show features grouped by workflow phase
  ideas         Surface and reconcile deferred ideas

Examples:
  /beastmode init
  /beastmode status
  /beastmode ideas
```

### 3. Execute Subcommand

Load and execute the appropriate subcommand file with full context.
