---
phase: plan
slug: 96e0e0
epic: dashboard-log-fixes-v2
feature: log-line-coloring
wave: 1
---

# Log Line Coloring

**Design:** .beastmode/artifacts/design/2026-04-11-96e0e0.md

## User Stories

3. As a pipeline operator, I want tree drawing characters (│, ├─, etc.) to always be dim grey regardless of log level, so that the tree structure is visually stable and readable.
4. As a pipeline operator, I want log messages to be white with only the level label (INFO, WARN, ERR) colored, so that I can quickly scan severity without the entire line being painted in yellow/red.

## What to Build

The `formatTreeLine()` function has a divergent code path for warn/error levels versus normal levels. The normal path correctly decomposes the line into parts — dim prefix, colored level label, white message. The warn/error path wraps the entire assembled line string in `chalk.yellow()` or `chalk.red()`, which paints the tree prefix characters, timestamp, and message text in the level color.

Fix the warn/error code path to match the normal path's decomposition:
- Tree prefix (│, ├─, etc.): always `chalk.dim()` regardless of level
- Phase badge: phase hex color (unchanged)
- Timestamp: `chalk.dim()` (unchanged)
- Level label: `chalk.yellow()` for WARN, `chalk.red()` for ERR (color applies to label string only)
- Message text: uncolored (white/default terminal color)

The normal path's existing behavior — `chalk.green()` for INFO label — is kept as-is.

Update unit tests to verify that warn/error lines have dim prefix, colored label only, and uncolored message. Tests can assert on chalk escape sequence presence/absence in the output string.

## Integration Test Scenarios

<!-- No behavioral scenarios — skip gate classified this feature as non-behavioral -->

## Acceptance Criteria

- [ ] Warn lines have dim prefix, yellow level label only, and uncolored message
- [ ] Error lines have dim prefix, red level label only, and uncolored message
- [ ] Info lines are unchanged (green label, dim prefix, white message)
- [ ] Tree drawing characters are always dim grey regardless of log level
- [ ] Unit tests verify chalk escape sequences in formatted output
