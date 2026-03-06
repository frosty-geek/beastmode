# Quality Gates

Quality gate definitions for the validate phase. Gates define criteria, thresholds, and pass/fail rules that must be satisfied before release. For markdown-only projects, standard gates are skipped and custom gates carry the full validation burden. Six custom gate types established through 41 validated features.

## Standard Gates
Tests, lint, and type checks. Always attempted. Skipped with rationale when not applicable (e.g., markdown-only projects have no test suite or linter). Skipped is not-applicable, not a failure.

1. ALWAYS attempt standard gates even if expected to skip
2. ALWAYS annotate skipped gates with rationale in the validation report
3. NEVER treat skipped gates as failures — they are not-applicable, not broken

## Custom Gate Types
Project-specific checks that replace or supplement standard gates. Six established types from practice:

- **Acceptance criteria** — Design doc criteria verified as pass/fail table (dominant gate type, used in 90%+ of reports)
- **Structural integrity** — File existence, directory structure, import chain verification
- **Stale reference detection** — grep-based scans for deprecated paths or patterns (e.g., `.agents/` after migration)
- **Cross-reference validation** — Skill file cross-references, SKILL.md completeness, step numbering
- **Content correctness** — Discovery logic, format compliance, no placeholder patterns
- **Regression checks** — Only expected files modified, no unintended side effects

1. ALWAYS define custom gates from the feature's acceptance criteria
2. ALWAYS verify structural changes with file existence checks
3. ALWAYS scan for stale references after migration or rename operations

## Gate Behavior
All gates must pass before proceeding to release. Partial passes are flagged but may be acceptable for non-critical items. The validation report captures both the gate result and any known issues with severity classification.

1. NEVER proceed to release with critical gate failures
2. ALWAYS document partial passes with impact assessment
3. ALWAYS capture known issues with severity and recommendation

## Manual Verification
Some gates require human judgment — invoke skills and verify behavior, check context files for placeholder patterns, confirm banner visibility in new sessions. Deferred checks are marked DEFER rather than PASS or FAIL.

1. ALWAYS verify skill invocation produces expected artifacts
2. ALWAYS check context files for placeholder patterns
3. ALWAYS mark deferred checks as DEFER with follow-up context
4. NEVER release without running validate phase
