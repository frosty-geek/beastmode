# CLI Architecture

## Command Structure
- CLI name: `beastmode` with three commands: `run <phase> <args>`, `watch`, `status`
- `beastmode run` executes a single phase in a CLI-owned worktree with streaming output
- `beastmode watch` runs the autonomous pipeline loop as a foreground process
- `beastmode status` shows epic state and cost-to-date without running Claude
- Design phase exception: `beastmode run design` spawns interactive Claude via `Bun.spawn` with inherited stdio — not the SDK

## Dispatch Abstraction
- ALWAYS use `DispatchedSession` interface for phase dispatch — strategy pattern decouples dispatch mechanism from orchestration logic
- `SdkSession`: uses `@anthropic-ai/claude-agent-sdk` `query()` with `prompt: "/beastmode:<phase> <args>"`, `settingSources: ['project']`, `permissionMode: 'bypassPermissions'` — typed session management, streaming, cost tracking
- `CmuxSession`: creates cmux terminal surface via JSON-RPC over Unix socket, sends `beastmode run <phase> <slug>` via `surface.send-text` — cmux owns the shell process, agents get full interactive terminal capability
- `SessionFactory` reads config + runtime state (cmux availability) to return the right session type — `auto` mode checks socket + ping
- AbortController for cancellation — clean shutdown on Ctrl+C
- Design phase exception: `beastmode run design` always spawns interactive Claude via `Bun.spawn` with inherited stdio — not dispatched through `SessionFactory`

## Worktree Lifecycle
- CLI owns full worktree lifecycle: create before session, point SDK at it via `cwd`, merge after completion, remove when done
- Branch detection rewritten in TypeScript — `feature/<slug>` branch reuse or creation from origin/HEAD
- Shell hook (`hooks/worktree-create.sh`) removed — functionality absorbed into CLI

## Configuration
- ALWAYS reuse `.beastmode/config.yaml` with `cli:` and `cmux:` sections — no separate config file
- `cli.interval` controls poll interval (default 60 seconds)
- `cmux.enabled` controls cmux integration (auto/true/false) — `auto` checks socket availability at runtime
- `cmux.notifications` controls notification verbosity (errors/phase-complete/full) — errors and blocks only by default
- `cmux.cleanup` controls surface cleanup timing (on-release/manual/immediate) — on-release mirrors worktree lifecycle
- Gates and other config sections are unchanged

## Cost Tracking
- Per-dispatch run log appended to `.beastmode-runs.json` — epic, phase, feature, cost_usd, duration_ms, exit_status, timestamp
- `beastmode status` reads run log for cost-to-date reporting

## Recovery Model
- State files are the recovery point, not sessions — stateless session model
- On startup, scan for existing worktrees with uncommitted changes and re-dispatch from last committed state
- Lockfile (`cli/.beastmode-watch.lock`) prevents duplicate watch instances
