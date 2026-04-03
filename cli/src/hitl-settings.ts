/**
 * hitl-settings.ts — Compose settings.local.json with HITL hooks.
 *
 * Merges existing settings (enabledPlugins, etc.) with PostToolUse
 * command hooks for decision logging. Designed for extension:
 * PreToolUse prompt hooks can be added alongside PostToolUse without
 * restructuring.
 *
 * Called from the phase command before spawning the interactive runner.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

/**
 * Compose HITL hooks into an existing settings object.
 *
 * Preserves all existing keys (enabledPlugins, etc.) and sets
 * `hooks` with the PostToolUse AskUserQuestion command hook.
 */
export function composeHitlSettings(
  phase: string,
  existingSettings: Record<string, unknown>,
): Record<string, unknown> {
  const hooks: Record<string, unknown[]> = {};

  // PostToolUse: decision logging
  hooks.PostToolUse = [
    {
      matcher: "AskUserQuestion",
      hooks: [
        {
          type: "command",
          command: `bun run "$(git rev-parse --show-toplevel)/cli/src/hitl-log.ts" ${phase}`,
        },
      ],
    },
  ];

  // PreToolUse: (reserved for hook-generation feature)

  return {
    ...existingSettings,
    hooks,
  };
}

/**
 * Read existing settings.local.json, compose HITL hooks, write back.
 *
 * Creates `.claude/` directory if missing. Uses empty object as
 * fallback when settings.local.json does not exist.
 */
export function writeHitlSettings(worktreePath: string, phase: string): void {
  const settingsPath = resolve(worktreePath, ".claude", "settings.local.json");
  const settingsDir = dirname(settingsPath);

  // Ensure .claude/ directory exists
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }

  // Read existing settings or fall back to empty object
  let existing: Record<string, unknown> = {};
  try {
    const raw = readFileSync(settingsPath, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    // Missing or unparseable — start fresh
  }

  const composed = composeHitlSettings(phase, existing);
  writeFileSync(settingsPath, JSON.stringify(composed, null, 2) + "\n");
}
