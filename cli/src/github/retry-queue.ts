/**
 * Retry Queue — pure functions for managing failed GitHub API operations.
 *
 * Operations are tracked as pending ops on SyncRef entries. Each op has a type,
 * retry count, next-retry tick, status, and context payload. Exponential backoff
 * computes tick-based delays: retry N waits 2^N ticks.
 *
 * After 5 failed retries, the operation is marked as permanently failed.
 */

import type { SyncRefs, SyncRef } from "./sync-refs.js";

/** Operation types that can be retried. */
export type OpType =
  | "bodyEnrich"
  | "titleUpdate"
  | "labelSync"
  | "boardSync"
  | "subIssueLink";

/** Status of a pending operation. */
export type OpStatus = "pending" | "failed";

/** A single pending operation awaiting retry. */
export interface PendingOp {
  opType: OpType;
  retryCount: number;
  nextRetryTick: number;
  status: OpStatus;
  context: Record<string, unknown>;
}

/** Maximum number of retry attempts before permanent failure. */
export const MAX_RETRIES = 5;

/**
 * Compute the next retry tick using exponential backoff.
 * Delay = 2^retryCount ticks (1, 2, 4, 8, 16).
 */
export function computeNextRetryTick(currentTick: number, retryCount: number): number {
  return currentTick + Math.pow(2, retryCount);
}
