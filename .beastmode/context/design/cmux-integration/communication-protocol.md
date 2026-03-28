## Context
The watch loop needs to communicate with cmux to create workspaces, surfaces, and send commands without process spawning overhead.

## Decision
Use JSON-RPC over Unix socket (`/tmp/cmux.sock`). A TypeScript `CmuxClient` class wraps the protocol with reconnection logic, timeout handling, and error mapping. Socket authentication uses `cmuxOnly` (process ancestry check) — beastmode inherits cmux ancestry automatically.

## Rationale
Unix socket avoids process spawning overhead, provides proper error handling, and is compatible with the Bun event loop. JSON-RPC is the native cmux protocol.

## Source
`.beastmode/state/design/2026-03-28-cmux-integration.md`
