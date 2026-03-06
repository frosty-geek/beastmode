# Structure

Directory layout for beastmode. `.beastmode/` is the central context hub with config.yaml and worktrees/. `skills/` contains agent workflows. `agents/` houses subagent prompts. `hooks/` for lifecycle scripts. `docs/` for essays. `scripts/` for maintenance. Knowledge hierarchy (context/, meta/, state/) lives under `.beastmode/`.

## Core Directories
`.beastmode/` stores L0-L3 knowledge hierarchy plus config.yaml (gate configuration) and worktrees/<feature>/ (gitignored). `skills/` contains workflow verb implementations. `agents/` has standalone agent prompts. `skills/_shared/` has cross-skill utilities (task-runner.md, retro.md, worktree-manager.md, context-report.md). `hooks/` contains plugin lifecycle scripts. `docs/` for external-facing essays. `scripts/` for maintenance scripts.

1. ALWAYS put phase-specific logic in `skills/{verb}/phases/`
2. ALWAYS put cross-skill utilities in `skills/_shared/`
3. ALWAYS put agent prompts in `agents/` as standalone documents
4. ALWAYS put plugin lifecycle hooks in `hooks/` as executable scripts
5. ALWAYS put external-facing essays in `docs/` — not imported by agents
6. Gate config lives at `.beastmode/config.yaml`
7. NEVER store knowledge outside `.beastmode/`
8. NEVER write to context/ or meta/ from phase execution — only retro promotes to L0/L1/L2

## Knowledge Directories
`context/` for published knowledge (L1 summaries + L2 details + L3 records). `meta/` for learnings (L1 summaries + L2 SOPs/overrides/learnings). `state/` for checkpoint artifacts. Write protection: phases write only to state/, retro promotes to context/ and meta/.

1. ALWAYS organize context by phase: `context/{phase}/{domain}.md`
2. ALWAYS organize meta by phase: `meta/{phase}/{type}.md` (sops, overrides, learnings)
3. ALWAYS organize state by phase: `state/{phase}/YYYY-MM-DD-{feature}.md`
4. L3 records live at: `context/{phase}/{domain}/{record}.md`

## Entry Points
`CLAUDE.md` imports `@.beastmode/BEASTMODE.md` (sole autoload). Skills load their own L1 context during 0-prime sub-phase. `/skills/{verb}/SKILL.md` defines each skill's interface and imports `@_shared/task-runner.md`.

1. ALWAYS wire CLAUDE.md → BEASTMODE.md as sole autoload
2. NEVER add additional @imports to CLAUDE.md
3. Skills discover their own L1/L2 context during 0-prime sub-phase
4. Each SKILL.md imports the shared task-runner at the end

## Related Decisions
- Migration from .agents/ to .beastmode/. See [agents-to-beastmode-migration](../../state/plan/2026-03-04-agents-to-beastmode-migration.md)
- Worktree session discovery. See [worktree-session-discovery](../../state/plan/2026-03-04-worktree-session-discovery.md)
- Progressive L1 docs restructure. See [progressive-l1-docs](../../state/plan/2026-03-04-progressive-l1-docs.md)
