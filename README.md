<div align="center">

# beastmode

**Turn Claude Code into a disciplined engineering partner.**

Opinionated workflow patterns that survived contact with reality.

[![GitHub stars](https://img.shields.io/github/stars/BugRoger/beastmode?style=flat-square)](https://github.com/BugRoger/beastmode/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

```bash
claude plugin add beastmode@beastmode-marketplace
```

<!-- TODO: Replace with assets/demo.svg when recorded -->
<!-- ![beastmode demo](assets/demo.svg) -->

## What It Does

Claude Code is powerful. But without structure, you re-explain your project every session, get inconsistent implementations, and lose work between context windows.

Beastmode fixes this. Five phases. Context persists. Patterns compound.

```
/design → /plan → /implement → /validate → /release
```

**Quick fix?** Implement, done.
**New feature?** Design the approach. Plan the tasks. Implement. Validate. Release.
**Multi-session?** Each phase writes artifacts to `.beastmode/`. Next session picks up where you left off.

## What Makes It Different

**Structured context, not flat retrieval.**

Embedding-based retrieval treats your codebase as a flat bag of chunks. As the codebase grows, precision collapses — agents get noise instead of signal, spending tokens on irrelevant context.

Beastmode organizes project knowledge into four levels: product vision, domain summaries, detail files, and raw artifacts. Agents navigate curated summaries at each level, loading detail only when the current task requires it. Deterministic navigation through a known structure, not probabilistic search through a vector space.

[Read the full argument →](docs/progressive-hierarchy.md)

**Knowledge compounds.**

Most AI tools start every session from scratch. Mistakes repeat. Patterns are rediscovered. Nothing accumulates.

Beastmode captures learnings at the end of every phase. Retro agents classify findings into standard procedures, project-specific overrides, and session insights. Recurring patterns auto-promote to SOPs. Each cycle makes Claude smarter about *your* codebase — not just any codebase.

**Context survives sessions.**

New session, blank slate, explain the architecture again. This is the default experience with AI coding tools.

Beastmode writes artifacts to `.beastmode/` — design specs, implementation plans, validation records, release notes. All stored as markdown in git. No vector database to maintain, no embeddings to regenerate. Context survives sessions, branches, and collaborators because it's just files in your repo.

**Design before code.**

Ask an AI for a login form and you might get an entire auth system. Without structure, scope explodes and implementation goes sideways.

Beastmode provides five phases: design the approach, plan the tasks, implement in isolation, validate quality, release to main. Trivial change? Skip to implement. Complex feature? Run every phase. The structure scales to complexity without adding overhead to simple work.

## Install

```bash
claude plugin add beastmode@beastmode-marketplace
```

Then initialize your project:

```bash
/beastmode install                # scaffold .beastmode/ structure
/beastmode init --brownfield      # auto-discover existing codebase
```

## Skills

| Skill | What it does |
|-------|-------------|
| `/design` | Brainstorm and create design specs through collaborative dialogue |
| `/plan` | Turn designs into bite-sized implementation tasks |
| `/implement` | Execute plans in isolated git worktrees |
| `/validate` | Quality gate — tests, lint, type checks |
| `/release` | Changelog, version bump, merge to main |
| `/status` | Track project state and milestones |
| `/beastmode` | Project initialization and discovery |

## How It Works

Every phase writes artifacts to `.beastmode/` — design specs, implementation plans, validation records, release notes. Your root `CLAUDE.md` imports the project context. Next session, Claude starts with full knowledge of your project.

The `.beastmode/` folder organizes four domains:
- **Product** — what you're building (vision, goals)
- **Context** — how to build it (architecture, conventions, testing)
- **State** — where features are in the workflow (design → release)
- **Meta** — what you've learned (phase retros that improve future sessions)

Knowledge compounds. After each cycle, learnings feed back into your project context. Claude gets smarter about *your* codebase over time.

## Credits

Built on ideas from [superpowers](https://github.com/obra/superpowers) and [get-shit-done](https://github.com/gsd-build/get-shit-done).

See the full [Changelog](CHANGELOG.md).

## License

MIT
