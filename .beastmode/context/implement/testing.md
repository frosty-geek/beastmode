# Testing

## Brownfield Verification
- ALWAYS verify L2 files contain project-specific content, not placeholders — real data only
- ALWAYS check: populated sections, actual file paths, real patterns from codebase — completeness
- NEVER accept generic content — every L2 entry should reference actual project artifacts
- Success criteria: all context L2 files populated after `init --brownfield` — no placeholder patterns remaining

## Critical Paths
- ALWAYS test brownfield on a real codebase before release — integration validation
- ALWAYS verify parallel agents produce non-conflicting output — concurrency safety
- ALWAYS verify atomic writes — no partial file states
- Core scenarios: brownfield execution, parallel agent spawning, content merge, atomic file writes — full coverage

## BDD Integration Tests (Cucumber)
- ALWAYS use source-analysis World pattern for Ink/React terminal UI component tests — no component rendering, pure source string parsing and runtime function calls
- ALWAYS create a dedicated cucumber profile per domain in `cucumber.json` — explicit import list (world, hooks, steps), isolated from other profiles
- ALWAYS write intentionally-failing scenarios first (wave 1) before the implementation that fixes them (wave 2) — BDD verifies the wiring bug, then the fix

context/implement/testing/cucumber-source-analysis-world.md
