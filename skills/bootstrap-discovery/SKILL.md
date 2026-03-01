---
name: bootstrap-discovery
description: Autonomous codebase analysis to generate .agent/prime/*.md docs. Use after /bootstrap on existing projects. Analyzes package manifests, file tree, code patterns, and docs to prefill project context.
---

# /bootstrap-discovery

Autonomous codebase analysis to prefill `.agent/prime/*.md` templates.

## Prerequisite Check

**FIRST:** Verify `.agent/prime/` exists.
- If missing: "Run `/bootstrap` first to create the .agent/ structure."
- If exists: Proceed with discovery

## Overview

This skill spawns a discovery subagent to analyze the codebase, then presents findings for your approval before writing each file.

## Execution Flow

### Step 1: Announce

> "Starting codebase discovery. I'll analyze your project and propose content for each prime document."

### Step 2: Spawn Discovery Subagent

Use the Agent tool with subagent_type `Explore`:

```yaml
Agent:
  subagent_type: Explore
  prompt: |
    Analyze this codebase following the discovery.md prompt.
    Return structured JSON findings for STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, and TESTING.
  description: "Analyze codebase for prime docs"
```

The subagent will:
- Scan package manifests (package.json, pyproject.toml, etc.)
- Analyze directory structure
- Sample code for patterns
- Check existing documentation
- Return structured findings

### Step 3: Present Findings

For each file in order: STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING

1. Transform subagent findings into markdown format matching template structure
2. Present to user:

> "**STACK.md** — Based on analysis:
>
> [show proposed content]
>
> Choose: **approve** / **edit** / **regenerate** / **skip**"

3. On approve: Write to `.agent/prime/STACK.md`
4. On edit: Ask what to change, update, re-present
5. On regenerate: Re-run analysis for this section
6. On skip: Move to next file

### Step 4: Update CLAUDE.md

After all files processed:
1. Read `.agent/CLAUDE.md`
2. Update the Rules Summary section with one-liners for each written file
3. Show changes and confirm before writing

### Step 5: Wrap-Up

> "Discovery complete. Files created:
> - ✅ STACK.md
> - ✅ STRUCTURE.md
> - ⏭️ CONVENTIONS.md (skipped)
> - ✅ ARCHITECTURE.md
> - ✅ TESTING.md
>
> Want me to commit these changes? (y/n)"

## Analysis Sources

| Source | Files | Informs |
|--------|-------|---------|
| Package manifests | `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod` | STACK.md |
| Config files | `.eslintrc`, `tsconfig.json`, `.prettierrc`, `ruff.toml` | STACK.md, CONVENTIONS.md |
| Directory tree | Root structure analysis | STRUCTURE.md |
| Code samples | 2-3 representative source files | CONVENTIONS.md |
| Documentation | `README.md`, `docs/` | ARCHITECTURE.md |
| Test files | `tests/`, `__tests__/`, `*_test.*` | TESTING.md |

## Safety Rules

- **Never read:** `.env`, `*.pem`, `credentials*`, `secrets*`, `*.key`
- **Always cite:** Include file paths for findings
- **Mark uncertainty:** Use `[inferred]` for low-confidence findings
- **Ask when unclear:** If findings are ambiguous, ask user to clarify

## Workflow

Part of: bootstrap → bootstrap-wizard OR **bootstrap-discovery** → prime → research → design → ...
