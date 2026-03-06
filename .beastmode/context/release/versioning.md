# Versioning

Versioning strategy and release mechanics. Semantic versioning detected from plugin.json. Squash merge collapses feature branches into one commit on main. Archive tags preserve branch history. Commit messages follow GitHub release style.

## Version Detection
Version read from `.claude-plugin/plugin.json`. Semantic versioning: major.minor.patch. Minor bumps for new capabilities or structural changes. Patch bumps for docs, polish, and fixes.

1. ALWAYS read version from `.claude-plugin/plugin.json`
2. ALWAYS follow semantic versioning for bumps
3. Minor bump = new feature or capability; patch bump = docs, polish, or targeted fix
4. Changelog generated from categorized commits (Highlights, Features, Fixes, Docs, Chores, Full Changelog)

## Commit Format
Release commits: `Release vX.Y.Z — Title` with categorized sections. One commit per version on main via squash merge. The em dash (—) is required, not a hyphen. Title subtitle uses "The Noun" pattern for thematic releases.

1. ALWAYS use format: `Release vX.Y.Z — Title`
2. ALWAYS include Highlights as the first section (1-2 sentence summary)
3. Include applicable category sections: Features, Fixes, Docs, Chores, Breaking Changes
4. ALWAYS include Full Changelog as the last section (commit SHAs or compare links)
5. NEVER create multiple commits per release on main
6. NEVER include empty category sections — only categories with content

## Archive Strategy
Feature branch tips preserved as `archive/feature/<name>` tags before deletion. Full branch history accessible via archive tags.

1. ALWAYS tag feature branch tip before deletion: `archive/feature/<name>`
2. NEVER delete feature branches without archiving
3. `git log --oneline main` should read as a scannable release history
