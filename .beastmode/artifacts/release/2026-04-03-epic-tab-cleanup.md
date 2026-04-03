---
phase: release
slug: epic-tab-cleanup
epic: epic-tab-cleanup
bump: minor
---

# Release: epic-tab-cleanup

**Version:** v0.62.0
**Date:** 2026-04-03

## Highlights

Wire `cleanup()` into ReconcilingFactory's release teardown so epic tabs close automatically on successful release, show error badges on failed releases, and reconcile orphan tabs from done epics at startup.

## Features

- Auto-close epic tabs/workspaces on successful release via `ReconcilingFactory.cleanup()` call in release success path
- Error badge on tab session for failed releases (`setBadge` on epic container)
- Orphan tab reconciliation at startup — done-manifest epics closed instead of adopted during `reconcile()`
- CmuxSessionFactory startup reconciliation with same done-manifest detection

## Full Changelog

- `daa37e6` design(epic-tab-cleanup): checkpoint
- `3a39bbc` design(epic-tab-cleanup): checkpoint
- `e342e86` plan(epic-tab-cleanup): checkpoint
- `df60327` implement(epic-tab-cleanup-release-cleanup): checkpoint
- `c0873cb` implement(epic-tab-cleanup-orphan-reconcile): checkpoint
- `8c61de8` implement(epic-tab-cleanup-release-badge): checkpoint
- `1ec10eb` validate(epic-tab-cleanup): checkpoint
