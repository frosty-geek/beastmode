/**
 * Session stats accumulator — subscribes to WatchLoop EventEmitter events
 * and maintains running session metrics.
 *
 * Pure logic module, decoupled from React rendering.
 */

import type { EventEmitter } from "node:events";
import type {
  SessionStartedEvent,
  SessionCompletedEvent,
  ScanCompleteEvent,
} from "../dispatch/types.js";

/** Pipeline phases tracked for duration averages. */
const TRACKED_PHASES = ["plan", "implement", "validate", "release"] as const;
type TrackedPhase = (typeof TRACKED_PHASES)[number];

/** Snapshot of accumulated session metrics. */
export interface SessionStats {
  /** Total completed sessions. */
  total: number;
  /** Currently active (in-flight) sessions. */
  active: number;
  /** Successfully completed sessions. */
  successes: number;
  /** Failed sessions. */
  failures: number;
  /** Sessions re-dispatched (same epic+phase+feature combo completed more than once). */
  reDispatches: number;
  /** Success rate as a percentage (0-100). 0 when no sessions completed. */
  successRate: number;
  /** Milliseconds since accumulator was created (updated on scan-complete). */
  uptimeMs: number;
  /** Sum of all completed session durations in milliseconds. */
  cumulativeMs: number;
  /** True until the first session-completed event fires. */
  isEmpty: boolean;
  /** Average duration per phase in ms, or null for unseen phases. */
  phaseDurations: Record<TrackedPhase, number | null>;
}

/** Options for dependency injection (testing). */
export interface AccumulatorOptions {
  /** Override Date.now() for deterministic uptime testing. */
  nowFn?: () => number;
}

/**
 * Subscribes to WatchLoop events and accumulates session metrics.
 */
export class SessionStatsAccumulator {
  private total = 0;
  private active = 0;
  private successes = 0;
  private failures = 0;
  private reDispatches = 0;
  private cumulativeMs = 0;
  private isEmpty_ = true;
  private uptimeMs = 0;

  /** Set of "epic:phase:feature" keys that have completed at least once. */
  private completedKeys = new Set<string>();

  /** Per-phase duration arrays for computing averages. */
  private phaseDurationArrays: Record<string, number[]> = {};

  private readonly startTime: number;
  private readonly nowFn: () => number;

  constructor(emitter: EventEmitter, options?: AccumulatorOptions) {
    this.nowFn = options?.nowFn ?? (() => Date.now());
    this.startTime = this.nowFn();

    emitter.on("session-started", (event: SessionStartedEvent) => {
      this.onSessionStarted(event);
    });

    emitter.on("session-completed", (event: SessionCompletedEvent) => {
      this.onSessionCompleted(event);
    });

    emitter.on("scan-complete", (_event: ScanCompleteEvent) => {
      this.onScanComplete();
    });
  }

  /** Return a snapshot of all accumulated metrics. */
  getStats(): SessionStats {
    const phaseDurations = {} as Record<TrackedPhase, number | null>;
    for (const phase of TRACKED_PHASES) {
      const arr = this.phaseDurationArrays[phase];
      if (arr && arr.length > 0) {
        phaseDurations[phase] = arr.reduce((a, b) => a + b, 0) / arr.length;
      } else {
        phaseDurations[phase] = null;
      }
    }

    return {
      total: this.total,
      active: this.active,
      successes: this.successes,
      failures: this.failures,
      reDispatches: this.reDispatches,
      successRate: this.total > 0 ? Math.round((this.successes / this.total) * 100) : 0,
      uptimeMs: this.uptimeMs,
      cumulativeMs: this.cumulativeMs,
      isEmpty: this.isEmpty_,
      phaseDurations,
    };
  }

  private onSessionStarted(event: SessionStartedEvent): void {
    this.active++;
  }

  private onSessionCompleted(event: SessionCompletedEvent): void {
    this.active = Math.max(0, this.active - 1);
    this.total++;
    this.isEmpty_ = false;

    if (event.success) {
      this.successes++;
    } else {
      this.failures++;
    }

    this.cumulativeMs += event.durationMs;

    // Phase duration tracking
    if (!this.phaseDurationArrays[event.phase]) {
      this.phaseDurationArrays[event.phase] = [];
    }
    this.phaseDurationArrays[event.phase].push(event.durationMs);

    // Re-dispatch detection
    const key = `${event.epicSlug}:${event.phase}:${event.featureSlug ?? ""}`;
    if (this.completedKeys.has(key)) {
      this.reDispatches++;
    } else {
      this.completedKeys.add(key);
    }
  }

  private onScanComplete(): void {
    this.uptimeMs = this.nowFn() - this.startTime;
  }
}
