# Design SOPs

Standard operating procedures for the design phase.

## Procedures

### Research before structural design decisions
When designing structural extensions, taxonomy changes, or workflow redesigns, produce a dated research artifact (saved to `.beastmode/state/research/`) from 3+ external authoritative sources before locking any decisions. The research informs the design; the design doesn't inform the research.

Promoted from recurring learnings: `implement-v2` (2026-03-04), `hitl-gate-config` (2026-03-04), `key-differentiators` (2026-03-05), `l2-domain-expansion` (2026-03-06).

### Walk every instance, don't describe the pattern
When a design decision involves N instances of a structural concept (gates, file moves, agent prompts), enumerate every instance in a concrete table or checklist rather than describing the abstract pattern. Concrete case-by-case analysis eliminates bad abstractions and catches edge cases that pattern descriptions miss.

Promoted from recurring learnings: `hitl-gate-config` (2026-03-04, "Concrete per-gate analysis eliminates bad abstractions"), `ungated-hitl-fixes` (2026-03-05, resolved by case-by-case analysis), `agent-extraction-audit` (2026-03-06, exhaustive table format for file moves).
