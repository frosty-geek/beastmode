#!/usr/bin/env bun
/**
 * hitl-auto.ts — PreToolUse command hook for AskUserQuestion.
 *
 * Static auto-answering script that replaces the LLM prompt hook.
 * Reads .beastmode/config.yaml at runtime, extracts phase prose, and either:
 * - Defers (no output) when prose is "always defer to human"
 * - Auto-answers every question with answer="Other" and prose in annotation notes
 *
 * Exits 0 always — hook failure must never block Claude.
 */

import { execSync } from "node:child_process";
import { loadConfig } from "../config.js";
import { getPhaseHitlProse } from "./hitl-settings.js";

// --- Core logic (exported for testing) ---

/**
 * Decide whether to auto-answer or defer, and return the response JSON string.
 * Returns null for defer (no output), or a JSON string for auto-answer.
 */
export function decideResponse(prose: string, rawToolInput: string): string | null {
  if (!prose || prose === "always defer to human") {
    return null;
  }

  let input: { questions?: Array<{ question: string }> };
  try {
    input = JSON.parse(rawToolInput);
  } catch {
    return null;
  }

  if (!input.questions || input.questions.length === 0) {
    return null;
  }

  const answers: Record<string, string> = {};
  const annotations: Record<string, { notes: string }> = {};

  for (const q of input.questions) {
    answers[q.question] = "Other";
    annotations[q.question] = { notes: prose };
  }

  return JSON.stringify({
    permissionDecision: "allow",
    updatedInput: {
      ...input,
      answers,
      annotations,
    },
  });
}

// --- CLI entry point ---

if (import.meta.main) {
  try {
    const phase = process.argv[2];
    if (!phase) {
      process.exit(0);
    }

    const rawToolInput = process.env.TOOL_INPUT;
    if (!rawToolInput) {
      process.exit(0);
    }

    const repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
    }).trim();
    const config = loadConfig(repoRoot);
    const prose = getPhaseHitlProse(config.hitl, phase);

    const response = decideResponse(prose, rawToolInput);
    if (response) {
      process.stdout.write(response);
    }
  } catch {
    // Silent exit — hook failure must never block Claude
  }
  process.exit(0);
}
