# Validate Context

Quality gates and verification strategy before release. The /validate skill runs standard checks and custom structural gates, then requires user approval before proceeding to release. For markdown-only projects, acceptance criteria from design docs are the primary verification mechanism.

## Quality Gates
Gate definitions — standard checks (tests, lint, types), custom structural gates from acceptance criteria, manual verification, and gate behavior rules. Custom structural gates are the primary mechanism for markdown-only projects. Six custom gate types established through practice.

1. ALWAYS run all configured quality checks before release
2. NEVER proceed to release with failing quality gates
3. Acceptance criteria from design docs are the primary gate for markdown-only projects

## Validation Patterns
Conventions for validation report structure and verification methodology. All reports follow the same skeleton: metadata header, standard gate sections, custom gates table, acceptance criteria, observations. Evidence standards require concrete proof for every PASS.

1. ALWAYS follow the standard report structure for validation artifacts
2. ALWAYS trace custom gates back to design acceptance criteria
3. NEVER assert PASS without verifiable evidence
