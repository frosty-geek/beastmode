# Best-Effort Visual Cleanup

## Context
ReconcilingFactory performs tab cleanup on release success and badge-setting on release failure. Both operations target visual surfaces (iTerm2 tabs, cmux workspaces) that may already be gone.

## Decision
ALWAYS wrap visual cleanup and badge operations in try-catch with warn-and-continue — failure to close a tab or set a badge must never roll back a successful release or block error reporting.

## Rationale
Visual surface operations are inherently unreliable: users may have manually closed tabs, iTerm2 may have recycled session IDs, cmux may have restarted. The release state (worktree removed, manifest marked done, branch archived) is the authoritative outcome. Visual cleanup is a convenience, not a correctness requirement. Consistent with the existing idempotent-close-pattern in CmuxClient.

## Source
cli/src/reconciling-factory.ts — cleanup() and setBadgeOnContainer() both use try-catch best-effort pattern
