---
phase: plan
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment
feature: release-closing-comment
wave: 2
---

# Release Closing Comment

**Design:** `.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md`

## User Stories

5. As a developer, I want a closing comment on released epics with version number, release tag, and merge commit, so that release history is discoverable from the issue timeline.

## What to Build

Post a release summary comment on the epic issue when the phase transitions to "done" (release complete).

**Comment Content:**
- A formatted comment announcing the release, including:
  - Version number (from plugin.json or manifest)
  - Release tag name (git tag)
  - Merge commit SHA with a GitHub commit link
  - Brief summary line (e.g., "Released in v0.65.0")
- The comment is distinct from the body update — it appears in the issue timeline as a milestone marker.

**Comment Trigger (github-sync.ts):**
- In the terminal cleanup section of `syncGitHub` (where phase is "done" or "cancelled"), post a closing comment before or alongside the epic close call.
- Only post the comment when the phase is "done" (not "cancelled" — cancelled epics don't get release comments).
- Use the existing `ghIssueComment()` function (or add one to gh.ts if it doesn't exist) to post the comment.
- The comment is posted once per release. Guard against duplicate comments using a flag in the manifest or by checking if a comment with the release version already exists.

**Comment Formatting:**
- A pure function in body-format.ts that takes release metadata (version, tag, mergeCommit, repo) and returns formatted markdown.
- Follows the same presence-based pattern: fields that are available get rendered, missing fields are skipped.

**gh Layer:**
- Add `ghIssueComment(repo, issueNumber, body, opts)` to gh.ts if not already present — wraps `gh issue comment` CLI command.

**Unit Tests:**
- Comment formatter: verify correct markdown output with all fields, verify partial fields, verify empty input.
- github-sync integration: verify comment is posted on "done" phase, not posted on "cancelled", verify warn-and-continue on comment failure.

## Acceptance Criteria

- [ ] Closing comment posted on epic issue when phase transitions to "done"
- [ ] Comment includes version number, release tag, and merge commit link
- [ ] No comment posted on cancelled epics
- [ ] Comment formatting is a pure function in body-format.ts
- [ ] gh.ts has ghIssueComment function (added if not present)
- [ ] Duplicate comment prevention (guard against posting twice)
- [ ] Warn-and-continue on comment failure (never blocks sync)
- [ ] Unit tests cover formatting, trigger conditions, and failure handling
