## Context
Operators running parallel agents need to know when something goes wrong without being interrupted by normal operation.

## Decision
Desktop notifications via `cmux notify` fire only on phase failures and blocked human gates. Verbosity controlled by `cmux.notifications` config (errors/phase-complete/full). Default is errors-only.

## Rationale
No news is good news. Operators should only be interrupted when action is needed. Configurable verbosity lets power users opt into more visibility.

## Source
`.beastmode/state/design/2026-03-28-cmux-integration.md`
