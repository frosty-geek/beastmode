/**
 * Re-export shim — cancel-logic moved to cancel/ module.
 * Kept for backward compatibility with commands/cancel.ts.
 */
export { cancelEpic } from "../cancel/index.js";
export type { CancelConfig, CancelResult } from "../cancel/index.js";
