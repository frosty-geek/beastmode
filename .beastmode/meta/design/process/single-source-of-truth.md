# Single Source of Truth

## Observation 1
### Context
During bulletproof-state-scanner design, 2026-03-29
### Observation
The design made three independent decisions that all enforced the same principle: (1) kill the fallback inline scanner to have one canonical implementation, (2) replace phase marker files with a top-level `manifest.phase` field so phase has one source, (3) remove the `manifest.phases` map that duplicated phase state in a different format. Each decision independently chose to eliminate a second source rather than reconcile it with the first. The explicit rationale was "a clean error is better than silently wrong data" — when two sources diverge, the failure mode of having one source (hard error) is better than the failure mode of two sources (silent disagreement).
### Rationale
Dual sources of truth create divergence that compounds silently. The design pattern is: when discovering dual sources, kill the secondary rather than adding reconciliation logic. Reconciliation adds complexity and still permits transient disagreement. A single source is simpler, fails loudly, and is easier to debug.
### Source
.beastmode/state/design/2026-03-29-bulletproof-state-scanner.md
### Confidence
[LOW] — first observation; pattern appeared three times within a single design but needs cross-session confirmation
