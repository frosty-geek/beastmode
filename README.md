# beastmode

> Turn Claude Code into a disciplined engineering partner.

Workflow patterns for Claude Code. Opinionated like crystallized engineering lore—patterns that survived contact with reality.

## The Workflow

A simple loop that scales from quick fixes to deep feature work:

```
/prime → /design → /plan → /implement → /release → /retro
```

**Quick fix?** Prime, implement, done.

**New feature?** Design the approach. Plan the tasks. Implement. Release. Learn.

**Multi-session project?** Each phase writes artifacts to `.beastmode/`. Next session, `/prime` restores context. Pick up where you left off.

**Every project?** `/retro` feeds learnings back into your agent instructions. Knowledge compounds automatically.

### Core Workflow

| Skill | Purpose |
|-------|---------|
| `/prime` | Load project context into session |
| `/design` | Think through the approach (auto-triggers research when needed) |
| `/plan` | Turn design into implementation tasks (auto-triggers research when needed) |
| `/implement` | Execute the plan, write the code |
| `/release` | Create changelog and release notes |
| `/retro` | Capture learnings for next time |

**Phase Research:** Both `/design` and `/plan` can automatically spawn a research phase when they detect keywords like "SOTA", "best practices", or unfamiliar tech. Research findings go to `.beastmode/state/research/`.

### Utilities

| Skill | Purpose |
|-------|---------|
| `/beastmode install` | Copy `.beastmode/` skeleton to project |
| `/beastmode init --greenfield` | Interactive setup for new projects |
| `/beastmode init --brownfield` | Autonomous discovery for existing codebases |
| `/research` | Explore domain when needed |
| `/status` | Track project state and milestones |

Use what helps. Skip what doesn't.

## Install

```bash
/plugin marketplace add bugroger/beastmode-marketplace
/plugin install beastmode@beastmode-marketplace
```

Then initialize your project:

```bash
/beastmode install
/beastmode init --greenfield  # or --brownfield

# Start building
/design
/plan
/implement
/validate
/release
```

## The `.beastmode/` Folder

All project context lives here:

```
.beastmode/
├── PRODUCT.md          # Product vision
├── META.md             # Documentation guidelines
├── state/              # Feature artifacts (tracked)
│   ├── design/         # Design specs
│   ├── plan/           # Implementation plans
│   ├── research/       # Domain exploration
│   └── release/        # Changelogs
├── context/            # Build knowledge
│   ├── design/         # Architecture, tech stack
│   ├── plan/           # Conventions, structure
│   └── implement/      # Agents, testing
├── meta/               # Phase learnings
├── sessions/           # Session state (gitignored)
│   ├── status/         # Feature status tracking
│   └── tasks/          # Task persistence
└── worktrees/          # Work isolation (gitignored)
```

Your root `CLAUDE.md` imports: `@.beastmode/PRODUCT.md`

## Why This Works

**Proven workflow.** Design before code. Plan before build. Old wisdom, applied to AI coding.

**Context survives sessions.** Each phase writes artifacts. Next session reads them. No lost work. No repeated explanations.

**Scales to complexity.** Trivial change? Skip to build. Complex feature? Run every phase. The workflow adapts.

**Knowledge compounds.** After each implementation, `/retro` updates your agent instructions. Patterns that work get encoded. Mistakes get documented. Over time, Claude gets smarter about *your* project—automatically.

**No ceremony.** No sprint planning. No story points. No standups. Just you, Claude, and the work.

## File Naming

- **UPPERCASE.md** — Meta files with fixed structure (CLAUDE.md, STATUS.md)
- **lowercase.md** — Content files, flexible structure

## Status

| Skill | Ready |
|-------|-------|
| `/prime` | ✅ |
| `/design` | ✅ |
| `/plan` | ✅ |
| `/implement` | 🚧 |
| `/release` | 🚧 |
| `/retro` | ✅ |
| `/beastmode` | ✅ |
| `/research` | 🚧 |
| `/status` | 🚧 |

## Credits

- [obra/superpowers](https://github.com/obra/superpowers) — Jesse Vincent's original disciplined workflow system
- [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) — Context engineering pioneer

## License

MIT
