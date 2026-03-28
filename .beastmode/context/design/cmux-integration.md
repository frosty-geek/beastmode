# cmux Integration

## Communication Protocol
- ALWAYS use JSON-RPC over Unix socket (`/tmp/cmux.sock`) for cmux communication — no process spawning overhead
- A TypeScript `CmuxClient` class wraps the protocol with reconnection logic, timeout handling, and error mapping
- Socket authentication uses `cmuxOnly` (process ancestry check) — beastmode inherits cmux ancestry when running inside cmux

## Surface Model
- ALWAYS create one cmux workspace per active epic — switching workspaces = switching epics
- ALWAYS create one cmux surface per dispatched phase or feature within the workspace — one terminal per agent
- Agent commands sent via `surface.send-text` — cmux owns the shell process, not beastmode
- Agents get full interactive terminal capability — can prompt for input at human gates

## Notifications
- ALWAYS fire desktop notifications only on phase failures and blocked human gates — no news is good news
- Notification verbosity controlled by `cmux.notifications` config (errors/phase-complete/full)
- Notifications use `cmux notify` command

## Lifecycle
- ALWAYS clean up cmux workspace and surfaces when an epic reaches release — mirrors git worktree lifecycle
- Cleanup timing controlled by `cmux.cleanup` config (on-release/manual/immediate)
- On startup, reconcile existing cmux workspaces: adopt live surfaces, close dead ones, remove empty workspaces

## Optionality
- cmux is NEVER a hard dependency — `cmuxAvailable()` check (socket exists + ping succeeds) gates all cmux paths
- `cmux.enabled` config (auto/true/false) combined with runtime check means zero regression risk
- When cmux is unavailable or disabled, existing SDK dispatch path runs unchanged via `SdkSession`
