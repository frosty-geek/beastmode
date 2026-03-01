# STRUCTURE - Codebase Structure

## Purpose

Documents the directory layout and where different types of files belong.

## Directory Layout

```
beastmode/
├── .agent/                 # Agent workflow context and documentation
│   ├── CLAUDE.md          # Project brain (prime directives reference)
│   ├── prime/             # Reference material (loaded every session)
│   │   ├── META.md        # How to maintain docs
│   │   ├── AGENTS.md      # Multi-agent coordination
│   │   ├── STACK.md       # Tech stack
│   │   ├── STRUCTURE.md   # Directory layout (this file)
│   │   ├── CONVENTIONS.md # Naming patterns
│   │   ├── ARCHITECTURE.md# System design
│   │   └── TESTING.md     # Test strategy
│   ├── research/          # Domain exploration artifacts
│   ├── design/            # Feature specs and design docs
│   ├── plan/              # Implementation task lists
│   ├── status/            # Current development state
│   ├── verify/            # Test and verification reports
│   ├── release/           # Changelogs and release notes
│   └── worktrees/         # Multi-threaded work isolation
├── agents/                # Agent implementations
│   └── discovery.md       # Discovery agent documentation
├── skills/                # Skill implementations (workflow commands)
│   ├── bootstrap/         # Initialize .agent/ folder structure
│   │   └── templates/     # SKILL.md + prime/*.md templates
│   ├── bootstrap-discovery/  # Autonomous codebase analysis
│   ├── bootstrap-wizard/     # Interactive project setup
│   ├── prime/             # Load project context
│   ├── research/          # Explore domain before building
│   ├── design/            # Think through approach
│   ├── plan/              # Create implementation tasks
│   ├── implement/         # Execute the plan
│   ├── status/            # Show development state
│   ├── verify/            # Prove it works
│   ├── retro/             # Capture learnings
│   └── release/           # Manage releases
├── .claude/               # Claude session metadata
├── .claude-plugin/        # Plugin configuration
├── CLAUDE.md              # Bridge: imports @.agent/CLAUDE.md
├── README.md              # Project overview and workflow
├── LICENSE                # MIT License
└── .gitignore             # Git ignore patterns
```

## Key Directories

**.agent/**
- Purpose: Central hub for all multi-session agent workflow context and documentation
- Contains: Prime documents (loaded each session), workflow phase artifacts, status tracking, and isolated worktrees
- Access pattern: Every agent command starts by loading `.agent/CLAUDE.md` which imports `.agent/prime/*.md`

**.agent/prime/**
- Purpose: Reference material that persists across sessions and guides agent behavior
- Contains: STACK.md, STRUCTURE.md, CONVENTIONS.md, ARCHITECTURE.md, TESTING.md (templates filled after `/bootstrap`)
- Usage: Loaded at session start, provides context for `/prime` skill and all downstream skills

**skills/**
- Purpose: Executable skill implementations that form the workflow commands
- Contains: Workflow verb skills (`/prime`, `/research`, `/design`, `/plan`, `/implement`, `/verify`, `/retro`) and bootstrap utilities
- Pattern: Each skill is a directory with SKILL.md describing objectives and process

**skills/bootstrap/templates/**
- Purpose: Template files for initializing new projects with canonical `.agent/` structure
- Contains: Invariant files (META.md, AGENTS.md) and templates (STACK.md, STRUCTURE.md, etc.)
- Usage: Copied during `/bootstrap` with sections filled by `/bootstrap-discovery` or `/bootstrap-wizard`

**agents/**
- Purpose: Agent implementations and coordination documentation
- Contains: Discovery agents for autonomous analysis

**.claude/, .claude-plugin/**
- Purpose: Claude-specific session and plugin metadata
- Contains: Session state, plugin configuration

## Key File Locations

**Entry Points:**
- `/bootstrap` skill: Initial project setup (from skills/bootstrap/SKILL.md)
- `/prime` skill: Session context loading (from skills/prime/SKILL.md)
- Root `README.md`: Workflow overview and installation instructions
- `.agent/CLAUDE.md`: Project brain (prime directives summary)

**Configuration:**
- `.agent/prime/*.md`: Seven prime documents defining stack, structure, conventions, architecture, testing, agents, and meta guidelines
- `skills/*/SKILL.md`: Individual skill specifications and process documentation
- `skills/bootstrap/templates/`: Template files for new project setup

**Core Logic:**
- `.agent/prime/STRUCTURE.md`: Where this document lives; defines how the codebase is organized
- `agents/`: Multi-agent coordination and discovery logic
- `skills/`: Workflow verb implementations

## Naming Conventions

**Files:**
- `UPPERCASE.md`: Meta files with fixed structure (CLAUDE.md, SKILL.md, STATUS.md)
- `lowercase.md`: Content files with flexible structure (research notes, design docs, etc.)
- `*.md`: All documentation and context files use Markdown format

**Directories:**
- `.agent/`: Hidden directory for workflow context (starts with dot)
- Verb-based names: `research/`, `design/`, `plan/`, `implement/`, `verify/`, `retro/` (lowercase gerunds/nouns)
- Skill directory naming: Skills match workflow command names exactly (`/bootstrap` → `skills/bootstrap/`)
- Worktrees: Organized by workflow phase and task name (`.agent/worktrees/implement/bootstrap-discovery-v2`)

**Skill Structure:**
- Each skill is a directory containing:
  - `SKILL.md`: Skill specification (objectives, process, templates, workflow)
  - `templates/` (optional): Files to be copied during skill execution

## Where to Add New Code

**New Workflow Skill:**
- Primary code: `skills/{verb-name}/SKILL.md` (skill specification)
- Templates: `skills/{verb-name}/templates/` (files to copy)
- Related context: Update `.agent/CLAUDE.md` rules if skill affects core workflow

**New Prime Document (reference material):**
- Location: `.agent/prime/{DOCUMENT}.md`
- Template source: `skills/bootstrap/templates/{DOCUMENT}.md`
- When: After filling bootstrap templates in any project

**New Agent Implementation:**
- Location: `agents/{agent-name}.md` or subdirectory
- Purpose: Coordination logic, discovery strategies, multi-threaded work patterns
- Reference: See `agents/discovery.md` for example

**Project-Specific Context (per-project in .agent/):**
- Research phase: `.agent/research/` (domain exploration)
- Design phase: `.agent/design/` (feature specs)
- Plan phase: `.agent/plan/` (task lists)
- Status: `.agent/status/` (current development state)
- Verify phase: `.agent/verify/` (test reports)
- Release phase: `.agent/release/` (changelogs)
