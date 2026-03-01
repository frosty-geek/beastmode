# CONVENTIONS - Code Conventions

## Purpose

Documents naming patterns, code style, and project-specific conventions.

## Naming

**Files:**
- UPPERCASE.md: Invariant meta files with fixed structure (always exist in `.agent/prime/`): CONVENTIONS.md, STACK.md, STRUCTURE.md, ARCHITECTURE.md, TESTING.md, META.md, AGENTS.md
- lowercase-with-dashes.md: Variant content files with flexible structure in research/, design/, plan/ folders: discovery.md, 2026-03-01-bootstrap-discovery-v2.md
- Date-prefixed files: YYYY-MM-DD-feature-name.md used in .agent/design/ and .agent/plan/ for timestamped decisions and tasks
- SKILL.md: Skill definition files, always uppercase, located at skills/{skill-name}/SKILL.md

**Variables:**
- kebab-case: directory names and URL segments: `/bootstrap`, `/bootstrap-discovery`, `.agent/prime/`
- PascalCase: component/skill names in documentation: Stack Agent, Conventions Agent, Explore

**Functions/Commands:**
- kebab-case with leading slash for skills: `/bootstrap`, `/prime`, `/design`, `/plan`, `/implement`, `/verify`, `/retro`
- lowercase for internal references and file operations

**Types/Interfaces:**
- PascalCase for agent types: Explore, Coordinator
- PascalCase for model identifiers: Haiku, Opus
- PascalCase for action types: merge, replace, keep, approve

## Code Style

**Imports:**
- Use `@` symbol to reference other docs: `@.agent/CLAUDE.md`, `@.agent/prime/META.md`
- Markdown files import other markdown files via references in the format `[description](path/to/file.md)`

**Exports:**
- Documents exported via frontmatter metadata at top of SKILL.md files with YAML format: `name:`, `description:`
- Prime reference files are read-only exports, marked clearly as invariant (META.md, AGENTS.md) or templates (STACK.md)

**Error Handling:**
- State management via file status markers: `**Status:** Ready for Plan`, `**Status:** Implemented`
- Validation through explicit merge rules: `- **Preserve** sections that have real content`, `- **Fill** sections that have placeholders`
- Uncertainty marked with: `[inferred]` or `[uncertain]` in analysis comments

## Patterns

**Agent Prompt Assembly:**
```markdown
1. Read: references/{prime}-agent.md
2. Read: references/common-instructions.md
3. Append: "\n\n## Current Content\n\n"
4. Append: .agent/prime/{PRIME}.md content
Result: Complete assembled prompt for agent execution
```

**Markdown Merge Strategy:**
```markdown
For each section in current content:
- Preserve: section has real content (not placeholders)
- Fill: section has placeholder patterns like [e.g., ...], [command]
- Update: section has stale or incomplete information
- Keep: original document structure and headings intact
```

**Multi-Agent Coordination:**
```markdown
Coordinator spawns N agents in parallel:
- Each agent: independent role + full context
- Assembly: read-compose-send (no state mutations)
- Collection: wait for all agents, collect markdown outputs
- Write: coordinator writes outputs directly to files
```

## Anti-Patterns

- NEVER use structured JSON for agent outputs (use markdown directly)
- AVOID adding placeholder examples like `[e.g., ...]` to completed sections
- NEVER create git stash entries unless explicitly requested
- AVOID long paragraphs in bullet lists (keep explanations to 1-3 bullets max)
- NEVER include "Warning Signs" subsections for obvious rules
- AVOID showing bad code examples for trivial mistakes
- NEVER mutate state in parallel agent execution (read → assemble → send model)
- AVOID reading secret files: `.env`, `*.pem`, `credentials*`, `secrets*`, `*.key`
