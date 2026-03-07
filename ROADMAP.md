# Roadmap

> What's shipped, what's next, and what we're not building.

## Now

Shipped and working in the current release.

- **Five-phase workflow** — design → plan → implement → validate → release
- **Configurable HITL gates** — `.beastmode/config.yaml` with `human`/`auto` modes per gate
- **Context persistence** — `.beastmode/` artifact storage survives across sessions
- **Meta layer** — phase retros capture findings that inform future sessions
- **Git worktree isolation** — each feature gets its own worktree and branch
- **Brownfield discovery** — `/beastmode init --brownfield` auto-populates context from existing codebases
- **Progressive knowledge hierarchy** — L0/L1/L2/L3 with fractal progressive enhancement
- **Phase auto-chaining** — transitions between phases fire automatically via Skill tool calls when context threshold is met, configurable per-transition in `config.yaml`
- **Confidence-gated meta promotion** — L3 records use confidence tags with frequency-based promotion to L1 Procedures
- **Checkpoint restart** — re-run any phase by passing its artifact path (e.g., `/plan .beastmode/state/design/...`)

## Next

Designed or partially built. Coming soon.

- **Demo recording** — terminal demo GIF/SVG for README.

## Later

On the radar. Not yet designed.

- **Community learning loop** — retro learnings don't stay in your project. Friction and patterns bubble up as issues to the beastmode repo automatically — crowdsourcing improvements from every user. The meta layer goes from project-scoped to ecosystem-scoped.
- **GitHub feature tracking** — features become GitHub issues. A kanban board tracks them through design → plan → implement → validate → release. State management updates labels as features move through phases. PRs link to artifacts, design docs, and plans. `.beastmode/state/` stays in sync, but now you can see everything in GitHub too.
- **Model profile control** — configure which model each subagent uses (Opus, Sonnet, Haiku) via `.beastmode/config.yaml`. Per-agent cost/quality tradeoffs. Budget mode for high-volume work, quality mode for critical architecture.
- **Progressive Autonomy Stage 3** — agent teams. Multiple agents pull features from a shared tasklist. Peers, not hierarchy. Each agent runs the full design → release pipeline independently.
- **Parallel features** — multiple features in separate worktrees simultaneously, with independent progress tracking.
- **Integration phase** — multi-feature coordination and merge conflict handling between parallel feature branches.
- **Other agentic tools** — Cursor, Copilot Workspace, and other AI coding environments beyond Claude Code.

## Not Planned

Deliberately out of scope.

- **Product phase** — deciding *what* to build. Beastmode handles Development (Feature → Story), not Portfolio or Program layers. Stay in your lane.
- **CI/CD integration** — use your existing pipelines. Beastmode produces code; your CI ships it.
- **Project management** — no sprints, no story points, no standups, no burndown charts. If you need those, use a project management tool.
