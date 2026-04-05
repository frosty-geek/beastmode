/**
 * Unit tests for retry-queue — backoff calculation and type validation.
 */

import { describe, test, expect } from "vitest";
import {
  computeNextRetryTick,
  MAX_RETRIES,
  type PendingOp,
  type OpType,
} from "../github/retry-queue";

describe("retry-queue: backoff calculation", () => {
  test("computeNextRetryTick returns currentTick + 2^retryCount", () => {
    expect(computeNextRetryTick(0, 0)).toBe(1);   // 0 + 2^0 = 1
    expect(computeNextRetryTick(1, 1)).toBe(3);   // 1 + 2^1 = 3
    expect(computeNextRetryTick(3, 2)).toBe(7);   // 3 + 2^2 = 7
    expect(computeNextRetryTick(7, 3)).toBe(15);  // 7 + 2^3 = 15
    expect(computeNextRetryTick(15, 4)).toBe(31); // 15 + 2^4 = 31
  });

  test("MAX_RETRIES is 5", () => {
    expect(MAX_RETRIES).toBe(5);
  });

  test("backoff at retry 0 is 1 tick", () => {
    expect(computeNextRetryTick(10, 0)).toBe(11); // 10 + 1
  });

  test("backoff at retry 4 is 16 ticks", () => {
    expect(computeNextRetryTick(10, 4)).toBe(26); // 10 + 16
  });
});

describe("retry-queue: PendingOp type shape", () => {
  test("PendingOp has required fields", () => {
    const op: PendingOp = {
      opType: "bodyEnrich",
      retryCount: 0,
      nextRetryTick: 1,
      status: "pending",
      context: { body: "test" },
    };
    expect(op.opType).toBe("bodyEnrich");
    expect(op.retryCount).toBe(0);
    expect(op.nextRetryTick).toBe(1);
    expect(op.status).toBe("pending");
    expect(op.context).toEqual({ body: "test" });
  });

  test("all OpType values are valid", () => {
    const types: OpType[] = ["bodyEnrich", "titleUpdate", "labelSync", "boardSync", "subIssueLink"];
    expect(types).toHaveLength(5);
  });
});
