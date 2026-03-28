# State Scanner

## Scanner Architecture
- ALWAYS use state-scanner.ts as the single canonical scanner — no inline scanner, no fallback implementations
- NEVER let the scanner write to the filesystem — scanner is read-only, reconciler is the sole writer
- ALWAYS discover epics by reading manifest files from the pipeline directory only — no design file dependency
- ALWAYS read phase from the top-level `manifest.phase` field — no inference from features, markers, or phases map
- Valid phase values: `plan | implement | validate | release | released`

## Phase Source of Truth
- ALWAYS use top-level `manifest.phase` as the single phase field — replaces both marker files and the `manifest.phases` map
- NEVER read phase marker files (`validate-<slug>`, `release-<slug>`) — eliminated in favor of `manifest.phase`
- NEVER read or write the `manifest.phases` map — superseded by top-level `manifest.phase`
- ALWAYS let the reconciler be the sole writer of `manifest.phase` — scanner never advances phase

## Merge Conflict Resolution
- ALWAYS auto-resolve git merge conflict markers in manifest files before parsing — preserves epic visibility after parallel merges
- ALWAYS take ours-side content (before `=======`) when conflict markers are detected — deterministic resolution
- NEVER crash on conflict markers — strip markers, attempt parse, maintain epic tracking

## Gate Detection
- ALWAYS use reactive gate blocking — check manifest feature statuses for `blocked` entries only
- NEVER do preemptive config gate checking in the scanner — agents run until they hit a gate and report back

## Error Handling
- ALWAYS skip the tick and retry on next poll when scanner errors occur — no retry limit, infinite retry with logging
- ALWAYS handle missing or empty pipeline directories gracefully — return empty array, no crash
- ALWAYS warn on slug collisions via stderr — use newest (last sorted) manifest when duplicates exist
- ALWAYS handle missing `manifest.phase` field gracefully — error/skip, not crash

## Cost Separation
- NEVER aggregate costs in the scanner — cost aggregation from `.beastmode-runs.json` is a separate concern for `beastmode status`
