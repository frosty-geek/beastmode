/**
 * cmux strategy — dispatches phase sessions to cmux terminal surfaces.
 *
 * Creates one workspace per epic, one surface per dispatched session.
 * Cleanup closes the workspace and all its surfaces.
 */

import type { SessionStrategy, DispatchOptions, DispatchHandle } from "./session-strategy.js";
import type { ICmuxClient } from "./cmux-client.js";

export class CmuxStrategy implements SessionStrategy {
  private client: ICmuxClient;
  /** Maps epic slugs to cmux workspace names. */
  private workspaceMap = new Map<string, string>();

  constructor(client: ICmuxClient) {
    this.client = client;
  }

  /**
   * Register an existing workspace for an epic.
   * Used by startup reconciliation to adopt workspaces from a previous session.
   */
  registerWorkspace(epicSlug: string, workspaceName: string): void {
    this.workspaceMap.set(epicSlug, workspaceName);
  }

  /**
   * Get the workspace name for an epic, if registered.
   */
  getWorkspace(epicSlug: string): string | undefined {
    return this.workspaceMap.get(epicSlug);
  }

  /**
   * Dispatch a phase session to a cmux surface.
   * TODO: Implement in cmux-strategy feature.
   */
  async dispatch(_opts: DispatchOptions): Promise<DispatchHandle> {
    throw new Error("CmuxStrategy.dispatch() not yet implemented — see cmux-strategy feature");
  }

  /**
   * Check if a session has completed.
   * TODO: Implement in cmux-strategy feature.
   */
  isComplete(_id: string): boolean {
    throw new Error("CmuxStrategy.isComplete() not yet implemented — see cmux-strategy feature");
  }

  /**
   * Clean up cmux resources for an epic.
   * Closes the epic's workspace (which closes all its surfaces).
   * Best-effort: catches all errors, logs warnings, never throws.
   */
  async cleanup(epicSlug: string): Promise<void> {
    const workspaceName = this.workspaceMap.get(epicSlug);
    if (!workspaceName) {
      console.log(`[cmux] cleanup: no workspace registered for ${epicSlug} — skipping`);
      return;
    }

    try {
      await this.client.closeWorkspace(workspaceName);
      console.log(`[cmux] cleanup: closed workspace ${workspaceName} for ${epicSlug}`);
    } catch (err) {
      // Best-effort — log and continue. Stale workspaces get cleaned on next startup reconciliation.
      console.warn(`[cmux] cleanup: failed to close workspace ${workspaceName} for ${epicSlug}:`, err);
    }

    // Always remove from map — even on error. The workspace either doesn't exist or is unreachable.
    this.workspaceMap.delete(epicSlug);
  }
}
