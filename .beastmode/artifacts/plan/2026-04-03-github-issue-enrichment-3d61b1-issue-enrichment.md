---
phase: plan
slug: github-issue-enrichment-3d61b1
epic: github-issue-enrichment-3d61b1
feature: issue-enrichment
wave: 2
---

# Issue Enrichment

**Design:** `.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md`

## User Stories

1. As a developer browsing GitHub issues, I want epic bodies to include PRD summary, user stories, and implementation decisions, so that I can understand the feature without leaving GitHub.
2. As a developer browsing GitHub issues, I want feature bodies to include their user story from the plan, so that I know what each feature implements.
3. As a developer, I want epic issues to link to the full PRD (repo-relative path and GitHub permalink), so that I can access the complete design document.
4. As a developer, I want epic issues to show branch name, phase tags, release version, and merge commit link, so that I can trace code changes back to the feature.
5. As a developer, I want a closing comment on released epics with version number, release tag, and merge commit, so that release history is discoverable from the issue timeline.
6. As a developer, I want the epic body to be updated at each phase transition with newly available information, so that the issue always reflects the current state of the feature.

## What to Build

**Body Format Extensions**

Extend `EpicBodyInput` with three optional field groups:

- `prdSections` — extracted PRD content: problem statement, solution, user stories, and implementation decisions. Each field optional within the group.
- `artifactLinks` — per-phase repo-relative paths and GitHub permalink URLs. Permalinks use the phase tag SHA (`beastmode/{slug}/{phase}`) as the commit anchor. Only phases that have been completed (and thus have artifacts and tags) appear.
- `gitMetadata` — branch name, phase tag references, release version string, and merge commit SHA. Populated progressively as the epic advances.

Extend `FeatureBodyInput` with an optional `userStory` field containing the full user story text extracted from the feature's plan file.

Extend `formatEpicBody` to render these new sections below the existing content. Use presence-based rendering: if a field group is present, render its section; if absent, emit nothing. No phase-conditional logic in the formatter — the caller decides what to provide at each phase.

Extend `formatFeatureBody` to render the user story section when present.

**Sync Orchestration**

Extend the github-sync orchestration to read artifact content before formatting bodies:

- Before formatting the epic body, use the artifact-reader module to load the PRD artifact for the current slug. Extract problem, solution, user stories, and decisions sections. Build artifact link entries for all completed phases (resolve paths from manifest.artifacts, construct permalink URLs from phase tag SHAs via git). Resolve git metadata: branch name from manifest.worktree, version from plugin.json (at release time), merge commit SHA (at release time).
- Before formatting each feature body, use the artifact-reader to load that feature's plan file (path from `manifest.features[n].plan`) and extract the `## User Stories` section.
- Pass all enriched data through to the format functions. The existing bodyHash mechanism automatically detects when the formatted body changes and triggers a GitHub update.

**Release Closing Comment**

When the epic phase is `done` (release complete), post a closing comment on the epic issue. The comment includes: version number, release tag name, and merge commit SHA with a GitHub link. This happens in the same sync cycle as the final body update and epic close. The comment is posted once — the sync should track whether it has already been posted (e.g., via a manifest flag or by checking existing comments).

**Progressive Enrichment Model**

The enrichment is progressive by nature of the presence-based rendering:
- After design: PRD sections + design artifact link appear in body
- After plan: plan artifact links + feature user stories appear
- After implement/validate: additional artifact links accumulate
- After release: version, merge commit, release tag appear + closing comment posted

No explicit phase switch — the sync just provides whatever data is available at each transition.

## Acceptance Criteria

- [ ] Epic body includes PRD problem, solution, user stories, and decisions sections (when PRD artifact exists)
- [ ] Epic body includes repo-relative artifact links with GitHub permalinks for completed phases
- [ ] Epic body includes branch name and phase tag references
- [ ] Epic body includes release version and merge commit link (after release)
- [ ] Feature body includes user story text extracted from plan file (when plan artifact exists)
- [ ] Bodies degrade gracefully — missing artifacts produce no section, not errors or empty headers
- [ ] Closing comment posted on epic when phase transitions to done, containing version, tag, and merge commit
- [ ] Closing comment posted exactly once (idempotent)
- [ ] Progressive enrichment verified: body content grows across phase transitions without losing earlier content
- [ ] Existing bodyHash mechanism correctly detects enriched body changes
- [ ] Unit tests for extended format functions: all field combinations, presence-based rendering, permalink formatting
- [ ] Integration tests for sync orchestration: artifact reading, git metadata resolution, closing comment generation
