# Pipeline Orchestration

## Execution Model
- ALWAYS use CronCreate with 1-minute recurring interval for the poll loop — session-scoped, expires after 7 days
- ALWAYS scan local state files to determine next action per epic — local files are the authority, not GitHub labels
- NEVER orchestrate the design phase — design is interactive and requires human collaboration
- Orchestrator picks up epics with a design artifact but no release artifact — scope is plan through release only

## Agent Spawning
- ALWAYS spawn one agent per phase per epic, except implement which fans out one agent per feature — parallelism at every level
- ALWAYS use `isolation: "worktree"`, `mode: "bypassPermissions"`, `run_in_background: true` for spawned agents — full isolation
- Agent prompts include role, task claim, skill invocation via Skill tool, and team-lead messaging — standardized agent protocol

## Team Organization
- ALWAYS create one team per epic with naming convention `pipeline-<epic-slug>` — scoped communication
- ALWAYS clean up team when epic reaches release — no orphaned teams

## Manifest Convergence
- ALWAYS merge implement worktrees sequentially after all agents for an epic finish — ordering prevents conflicts
- ALWAYS verify manifest completeness after merging — all features must show completed
- When merge conflicts arise, spawn a conflict-resolution agent to auto-resolve — no manual intervention for trivial conflicts

## Gate Handling
- ALWAYS respect config.yaml gate settings during orchestration — human gates still pause
- When a gate is `human`, agent blocks and messages orchestrator which relays to user — gate integrity preserved

## Lifecycle
- Start via `/beastmode orchestrate start`, stop via `/beastmode orchestrate stop` — explicit control
- NEVER auto-drain or idle-timeout — manual stop only
- CronCreate jobs are session-scoped — orchestrator naturally stops if session ends
