---
phase: plan
slug: epic-tab-cleanup
epic: epic-tab-cleanup
feature: orphan-reconcile
wave: 1
---

# Orphan Reconcile

**Design:** .beastmode/artifacts/design/2026-04-03-epic-tab-cleanup.md

## User Stories

1. As a user restarting the watch loop, I want orphan tabs from done epics to be cleaned up during startup reconciliation, so that crash recovery doesn't leave ghost windows.

## What to Build

Extend startup reconciliation in both dispatch strategies to cross-reference adopted sessions against manifest state. Currently, reconcile adopts any live `bm-*` session and closes stale ones. It should additionally check the manifest for each adopted session's epic — if the manifest phase is "done", close the session instead of adopting it.

**ITermSessionFactory.reconcile():** After finding a live `bm-*` session, load the manifest for the extracted epic slug. If `manifest.phase === "done"`, close the session instead of adopting it into the tabs map.

**CmuxSessionFactory reconcile (reconcile-startup.ts):** Apply the same done-manifest guard when reconciling cmux workspaces.

Both reconcile paths need access to the manifest store, which requires the project root. The reconcile methods may need additional parameters or a factory-level project root reference to perform manifest lookups.

Extend existing reconciliation tests to verify:
- Live sessions for done-manifest epics are closed, not adopted
- Live sessions for active-manifest epics are still adopted (no regression)
- Missing manifests default to adoption (safe fallback)

## Acceptance Criteria

- [ ] ITermSessionFactory.reconcile() closes live sessions for done-manifest epics
- [ ] CmuxSessionFactory startup reconcile closes workspaces for done-manifest epics
- [ ] Sessions for active epics are still adopted normally (regression guard)
- [ ] Missing manifests default to adoption, not closure (safe fallback)
- [ ] Test: reconcile closes session when manifest phase is "done"
- [ ] Test: reconcile adopts session when manifest phase is active
- [ ] Test: reconcile adopts session when manifest is missing
