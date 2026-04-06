# Competitor Research: Superpowers vs GSD vs Beads vs Beastmode

Date: 2026-04-06

## Superpowers (github.com/obra/superpowers)

- **Core**: Agentic skills framework + software dev workflow for Claude Code
- **Philosophy**: Replace "vibe coding" with mandatory "check-before-act" skill protocol
- **Workflow**: Brainstorm → plan → git worktree → subagent orchestration → TDD (RED/GREEN) → code review → PR/merge
- **Context**: Shared JSON state (`~/.supremepower/state.json`), repo files like `.github/supremepower-active.md`
- **Orchestration**: VS Code sidebar, CLI (`sp next`), subagent dispatching, skills marketplace
- **Persistence**: Git worktrees preserve branches/tasks, shared state engine syncs context across IDE/CLI/Copilot
- **Key differentiator**: Multi-tool sync (VS Code + terminal + Copilot), composable skills marketplace, self-extensible skills
- **Sources**: blog.fsck.com, github.com/obra/superpowers, mintlify docs

## GSD / get-shit-done (github.com/gsd-build/get-shit-done)

- **Core**: Lightweight meta-prompting, context engineering, and spec-driven dev system
- **Philosophy**: Reliability and speed — turn vague ideas into committed, functional projects consistently
- **Workflow**: `gsd new project` → goal prompt → clarifying questions → structured plan → build → auto-commit
- **Context**: Meta-prompting for context control, spec-driven output, markdown-ready outputs
- **Orchestration**: Command-driven (`/gsd`), no dashboard, no visual UI
- **Persistence**: Git commits, folder organization, spec files
- **Key differentiator**: Lowest ceremony, fastest to start, works across Claude Code/OpenCode/Gemini CLI/Codex
- **Sources**: github.com/gsd-build/get-shit-done, YouTube tutorials

## Beads (github.com/steveyegge/beads)

- **Core**: AI-supervised issue tracker plugin — persistent memory across sessions
- **Philosophy**: Solve context amnesia with automatic issue tracking
- **Workflow**: Auto-creates/updates issues as Claude works, tracks dependencies, hierarchical parent-child (epics/subtasks)
- **Context**: SQLite database stored as JSONL (git-compatible), accessible via slash commands
- **Orchestration**: No dashboard, no pipeline, no phase system — pure issue tracking
- **Persistence**: SQLite/JSONL in beads folder, always persistent, repo-aware
- **Key differentiator**: Solves one problem extremely well (memory/tracking), created by Steve Yegge
- **Note**: Anthropic's Claude Code Tasks (v2.1.16+) incorporated Beads-inspired native functionality
- **Sources**: github.com/steveyegge/beads, YouTube demos, paddo.dev comparison

## Positioning Summary

| Dimension | GSD | Beads | Superpowers | Beastmode |
|-----------|-----|-------|-------------|-----------|
| Primary value | Speed to done | Persistent memory | Disciplined skills | Full lifecycle + autonomy |
| Ceremony level | Minimal | None (auto) | Medium | High (by design) |
| Phase structure | Loose (plan→build) | None | Plan→TDD→review | 5 phases (design→release) |
| Context persistence | Specs in git | SQLite/JSONL DB | Shared JSON state | Markdown in .beastmode/ |
| Dashboard/TUI | No | No | VS Code sidebar | Fullscreen TUI |
| Pipeline orchestration | No | No | Subagent dispatch | WatchLoop + iTerm2 agents |
| Self-improving | No | No | No | Yes (retro→context promotion) |
| Multi-epic parallel | No | No | No | Yes |
| Target user | Quick builders | Memory-focused | Disciplined devs | Teams/complex projects |
