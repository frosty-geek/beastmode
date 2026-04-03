---
phase: plan
slug: epic-tab-cleanup
epic: epic-tab-cleanup
feature: release-badge
wave: 2
---

# Release Badge

**Design:** .beastmode/artifacts/design/2026-04-03-epic-tab-cleanup.md

## User Stories

1. As a user running the pipeline, I want failed release tabs to show an error badge on the tab itself, so I know which lingering tabs need attention.

## What to Build

Add a container-level badge method to the SessionFactory interface and implement it in both concrete factories. ReconcilingFactory calls it on the release failure path so surviving tabs display a visible error indicator.

**Interface extension:** Add an optional `setBadgeOnContainer?(epicSlug: string, text: string): Promise<void>` method to the SessionFactory interface. This sets a badge on the epic's top-level container (tab for iTerm2, workspace notification for cmux) rather than on individual panes.

**ITermSessionFactory implementation:** Look up the tab session ID from the internal tabs map and call `this.client.setBadge(tabSessionId, text)`. Existing badge infrastructure (setBadge on the It2Client) already works — it just needs to target the tab session instead of a pane session.

**CmuxSessionFactory implementation:** Cmux doesn't have native badge support. Implement as a no-op or use workspace rename as a visual signal (e.g., prefix workspace name with "ERROR:").

**ReconcilingFactory wiring:** In the release teardown block, when the release fails (either directly or because teardown errored), call `this.inner.setBadgeOnContainer?.(epicSlug, "ERROR: release failed")` so the lingering tab is visually marked.

Extend tests to verify:
- Failed release triggers badge on the container
- Successful release does NOT trigger badge
- Badge failure is best-effort (caught, logged, non-blocking)

## Acceptance Criteria

- [ ] SessionFactory interface includes optional `setBadgeOnContainer` method
- [ ] ITermSessionFactory sets badge on the tab session ID (not pane)
- [ ] CmuxSessionFactory handles badge gracefully (no-op or workspace rename)
- [ ] ReconcilingFactory calls setBadgeOnContainer on release failure
- [ ] Badge call is best-effort — failure is caught and logged
- [ ] Test: failed release triggers container badge
- [ ] Test: successful release does NOT trigger container badge
