# File Naming

## Context
Beastmode uses many markdown files at multiple hierarchy levels. Consistent naming conventions prevent confusion about which files are invariant infrastructure vs. variant content.

## Decision
UPPERCASE.md for invariant meta files (always exist, same structure). lowercase.md for variant files (plans, research, date-prefixed). State files use YYYY-MM-DD-feature-name.md format.

## Rationale
- UPPERCASE signals "always present, don't delete" vs lowercase "comes and goes"
- Date prefixes on state files enable chronological ordering without metadata
- Convention is self-documenting — naming reveals file purpose

## Source
state/plan/2026-03-06-hierarchy-cleanup.md
