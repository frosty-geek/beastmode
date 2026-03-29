# State Scanning

## Epic Discovery
- ALWAYS discover epics from manifest files (.manifest.json) — never from design files or date heuristics
- Scan state/plan/ first (lower priority), then pipeline/ (higher priority) — pipeline entries overwrite plan entries for dedup
- Pipeline supports both nested dirs (pipeline/{slug}/manifest.json) and flat files (pipeline/{slug}.manifest.json)
- Slug extraction strips date prefix and .manifest.json suffix from filenames

## Phase Derivation
- ALWAYS derive current phase from the manifest.phases map — no filesystem marker sniffing
- Phase logic: release completed = done, no features = plan, all features completed + validate completed = release, all features completed = validate, otherwise = implement
- designPath is optional on EpicState — epics discovered from manifest may not have a design file reference

## Status Display
- Status table columns: Epic, Phase, Progress, Blocked, Last Activity — no cost column
- Sort by lastUpdated descending, then alphabetically by slug for ties
- Progress shows completed/total only during implement phase, dash otherwise

## Next Action Derivation
- Plan phase: single action dispatching the epic slug
- Implement phase: fan-out action listing pending and in-progress feature slugs
- Validate/Release: single action dispatching the epic slug
- Completed (done) epics return null next action
