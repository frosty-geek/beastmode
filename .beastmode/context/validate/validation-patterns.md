# Validation Patterns

Conventions for validation report structure and verification methodology. Crystallized from 41 validation reports across diverse features. The pattern is consistent regardless of feature type.

## Report Structure
Every validation report follows the same skeleton: header (date, feature, PASS/FAIL status), standard gates section (tests/lint/types with skip rationale), custom gates table, acceptance criteria matrix, and files changed list.

1. ALWAYS include date, feature name, and overall PASS/FAIL status in the header
2. ALWAYS include standard gate sections even when all are skipped
3. ALWAYS present custom gates as a table with gate name and pass/fail result
4. ALWAYS include gate count summary (e.g., "6/6 gates passed")

## Acceptance Criteria Verification
Acceptance criteria come from the design artifact. Each criterion maps to a specific structural check performed during validation. PASS/FAIL/DEFER status per criterion — DEFER for checks requiring conditions not available in the current session.

1. ALWAYS trace each custom gate back to a design acceptance criterion
2. ALWAYS use PASS/FAIL/DEFER status per criterion — never leave status ambiguous
3. NEVER mark a criterion PASS without performing the actual check

## Evidence Standards
Every gate result requires specific evidence. Tables with pass/fail columns. Counts, line numbers, file paths, grep results. Assertion without proof is not validation.

1. ALWAYS include concrete evidence for PASS results (file paths, line counts, grep output)
2. ALWAYS use tabular format for acceptance criteria (criterion | status columns minimum)
3. NEVER assert PASS without verifiable evidence
