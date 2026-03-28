## Context
cmux is a macOS-only desktop application. The pipeline must work without it for CI, Linux, and users who don't have it installed.

## Decision
cmux is never a hard dependency. `cmuxAvailable()` checks socket exists + ping succeeds. `cmux.enabled` config (auto/true/false) gates integration. When unavailable or disabled, the existing SDK dispatch path runs unchanged via `SdkSession`. The `DispatchedSession` strategy pattern ensures the watch loop is dispatch-mechanism-agnostic.

## Rationale
Zero regression risk. The existing SDK path is the `SdkSession` implementation, fully preserved. The strategy pattern extraction has standalone value for testability regardless of cmux.

## Source
`.beastmode/state/design/2026-03-28-cmux-integration.md`
