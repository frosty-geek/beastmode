# Changelog

Changelog structure and generation conventions. Covers both per-release state artifacts (written during each release) and the consolidated CHANGELOG.md at repo root.

## Release Artifact Format
Per-release state docs live at `.beastmode/state/release/YYYY-MM-DD-vX.Y.Z.md` and follow a standard structure. Highlights (required) leads, then optional sections for Breaking Changes, Features, Fixes, Docs, Chores, and Full Changelog (required). Migration releases may include a Migration table.

1. ALWAYS start with `# Release vX.Y.Z — Title` heading
2. ALWAYS include `**Date:** YYYY-MM-DD` immediately after the title
3. ALWAYS include a Highlights section summarizing the release in 1-2 sentences
4. Include applicable category sections: Features, Fixes, Docs, Chores, Breaking Changes
5. ALWAYS include Full Changelog as the final section with commit hashes or compare links
6. NEVER include empty category sections — only sections with content
7. Include Cycle/State Artifacts links when design/plan docs exist

## Consolidated Changelog
CHANGELOG.md at repo root consolidates multiple releases into scannable entries. Introduced in v0.6.0. Follows high-star GitHub changelog patterns. Version entries have personality-infused titles matching the `Release vX.Y.Z — Title` convention.

1. ALWAYS maintain CHANGELOG.md at repo root
2. Consolidate related minor releases into single entries for scannability
3. Include version titles with personality (matching commit message convention)
4. README should link to CHANGELOG.md

## Commit Categorization
Changes in release artifacts are categorized using conventional commit types. Categories map to changelog sections: `feat` -> Features, `fix` -> Fixes, `docs` -> Docs, `chore`/`refactor` -> Chores. Breaking changes get their own section regardless of commit type.

1. ALWAYS categorize commits by type: feat, fix, docs, chore, refactor
2. Map to changelog sections: Features, Fixes, Docs, Chores
3. Breaking changes get their own section regardless of commit type
4. Docs-only releases note "No code changes" in Full Changelog
