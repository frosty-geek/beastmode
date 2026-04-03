# Release Comment

## Context
After release, there was no discoverable record in the GitHub issue timeline of what version shipped, when, or how.

## Decision
On phase transition to "done", the CLI posts a closing comment on the epic issue containing version number, release tag link, and merge commit link. Duplicate prevention uses content scanning — `ghIssueComments()` retrieves existing comments and checks for the version string before posting. Two new gh.ts functions: `ghIssueComment()` (post) and `ghIssueComments()` (list). Comment formatting is a pure function in body-format.ts (`formatClosingComment` / `formatReleaseComment`).

## Rationale
A comment is better than a body-only update because it appears in the issue timeline as a discrete event, making release history scannable. Content-based duplicate prevention (rather than a manifest flag) is idempotent across re-syncs and doesn't add state to the manifest. Two formatting functions exist: `formatClosingComment` (strict, all fields required) and `formatReleaseComment` (lenient, presence-based) — the sync uses the lenient variant since metadata may be partially available.

## Source
.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md
