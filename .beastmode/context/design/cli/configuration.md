## Context
The CLI needs configuration for poll intervals, CLI-specific settings, and optional cmux integration without introducing separate config files.

## Decision
Reuse `.beastmode/config.yaml` with `cli:` and `cmux:` sections. `cli.interval` controls poll interval (default 60 seconds). `cmux.enabled` (auto/true/false) controls cmux integration. `cmux.notifications` (errors/phase-complete/full) controls notification verbosity. `cmux.cleanup` (on-release/manual/immediate) controls surface cleanup timing.

## Rationale
Single config file reduces cognitive overhead. The `cli:` and `cmux:` namespaces avoid collision with existing config sections. The `cmux:` section sits alongside `gates:` and `github:` as a peer configuration domain.

## Source
`.beastmode/state/design/2026-03-28-typescript-pipeline-orchestrator.md`
`.beastmode/state/design/2026-03-28-cmux-integration.md`
