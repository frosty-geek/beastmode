---
phase: plan
slug: gh-error-diagnostics
epic: gh-error-diagnostics
feature: logger-threading
wave: 1
---

# Logger Threading

**Design:** `.beastmode/artifacts/design/2026-04-03-gh-error-diagnostics.md`

## User Stories

1. As a pipeline operator, I want `gh api` errors to show the full endpoint path (e.g., `repos/.../issues/5/sub_issues`), so that I can identify which API call failed without guessing.
2. As a pipeline operator, I want `gh api` errors to include the epic slug in the log prefix, so that I can correlate failures to specific epics in a parallel pipeline.
3. As a pipeline operator, I want all GitHub sync warnings to flow through the same logger hierarchy, so that I get consistent log formatting across the entire sync path.

## What to Build

Two changes that work together to produce actionable error messages:

**Error message improvement:** The inner `gh()` function currently logs `gh ${args[0]} failed` — for `gh api` calls this shows only "api" with no endpoint. Change to `args.slice(0, 2).join(" ")` so the message includes the verb and first argument (endpoint path for `gh api`, subcommand for others like `gh issue`).

**Logger threading through helpers:** The inner `gh()` function already accepts `logger?: Logger` in its opts. The 11 helper functions (`ghLabelCreate`, `ghIssueEdit`, `ghIssueCreate`, `ghIssueClose`, `ghIssueReopen`, `ghIssueState`, `ghIssueLabels`, `ghProjectItemAdd`, `ghProjectSetField`, `ghProjectItemDelete`, `ghSubIssueAdd`) do not — they accept `opts: { cwd?: string }` and call `gh(args, { cwd: opts.cwd })`, dropping any logger. Add `logger?: Logger` to each helper's opts type and forward it to the inner `gh()` / `ghJson()` / `ghGraphQL()` call.

**Sync layer threading:** `syncGitHub()` does not accept a logger parameter. Add `logger?: Logger` to its signature and thread it to every `gh*` call site within the function. `syncGitHubForEpic()` already accepts an optional logger — pass it through to `syncGitHub()`.

The result: when `syncGitHubForEpic()` is called with a logger carrying prefix `watch:my-epic`, every `gh` CLI failure logs as `HH:MM:SS watch:my-epic: gh api repos/.../issues/5/sub_issues failed (exit 1): Not Found (HTTP 404)` instead of the current `gh api failed (exit 1): gh: Not Found (HTTP 404)`.

## Acceptance Criteria

- [ ] `gh()` error messages include `args.slice(0, 2).join(" ")` instead of `args[0]`
- [ ] All 11 gh helper functions accept `logger?: Logger` in their opts parameter
- [ ] All gh helper functions forward the logger to their inner `gh()` / `ghJson()` / `ghGraphQL()` call
- [ ] `syncGitHub()` accepts an optional `logger` parameter
- [ ] `syncGitHub()` passes the logger to every `gh*` call within its body
- [ ] `syncGitHubForEpic()` passes its logger to `syncGitHub()`
- [ ] Existing tests pass without modification
