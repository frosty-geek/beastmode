# Prompt Injection Pattern

## Observation 1
### Context
During commit-issue-refs design, 2026-03-31
### Observation
The PRD initially proposed skills reading the manifest directly to get GitHub issue refs. This violated the architectural invariant that skills are manifest-unaware. The resolution was a novel data-passing pattern: CLI reads manifest data, builds a structured `<commit-refs>` block, and injects it into the prompt string before SDK dispatch. Skills read the refs from prompt context only — they never know the data came from the manifest. This preserves the manifest-unaware invariant while extending what skills can do with manifest-derived data.
### Rationale
When a component (skill) must remain ignorant of a data source (manifest) but needs data derived from that source, the resolution is to have the boundary owner (CLI) extract and inject the data into the component's native input channel (prompt string). The receiving component reads structured data from its input without knowing the provenance. This is distinct from "infrastructure over instructions" (which moves enforcement to hooks) and "single source of truth" (which eliminates dual sources). This pattern preserves an ignorance boundary while enabling data flow across it. The structured block format (`<commit-refs>`) makes the injection grep-able and parseable without polluting the prompt's natural language.
### Source
.beastmode/artifacts/design/2026-03-31-commit-issue-refs.md
### Confidence
[LOW] — first-time observation; the pattern is novel within this codebase but needs confirmation that it generalizes beyond commit refs
