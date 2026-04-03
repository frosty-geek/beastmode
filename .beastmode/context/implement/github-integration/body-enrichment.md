# Body Enrichment

## Context
Epic and feature issue bodies were minimal — phase badge, one-line summary, and feature checklist. No PRD content, user stories, artifact links, or git traceability. Developers had to leave GitHub to understand what a feature does.

## Decision
The CLI reads artifact markdown files at sync time, extracts sections via regex-based splitter, and passes enriched data to pure body-format functions. Three new modules: section-extractor.ts (frontmatter-aware `## ` heading extraction), section-splitter.ts (heading-to-map splitting), and artifact-reader.ts (resolve + read + split orchestration with manifest-first/glob-fallback path resolution). All body sections use presence-based rendering: optional fields on EpicBodyInput/FeatureBodyInput control section emission — present = render, absent = omit, no phase-conditional logic.

## Rationale
Reading artifacts at sync time keeps the manifest lean and avoids a second source of truth for content. Presence-based rendering means progressive enrichment emerges naturally as phases advance — the sync function just assembles whatever data is currently available. Regex section splitting is sufficient because PRD and plan heading structures are controlled templates. Artifact path resolution with manifest-first/glob-fallback provides resilience against missing manifest entries while preferring the authoritative path.

## Source
.beastmode/artifacts/design/2026-04-03-github-issue-enrichment-3d61b1.md
