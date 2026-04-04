#!/usr/bin/env bun
/**
 * hitl-log.ts — PostToolUse command hook for AskUserQuestion.
 *
 * Logs each HITL decision to a structured markdown file at
 * .beastmode/artifacts/<phase>/hitl-log.md.
 *
 * Detects whether the answer was auto-filled by the PreToolUse hook
 * or provided by a human, and tags accordingly.
 *
 * Exits 0 always — hook failure must never block Claude.
 */

import { mkdirSync, appendFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execSync } from "node:child_process";

// --- Types ---

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface Question {
  question: string;
  header?: string;
  options?: QuestionOption[];
  multiSelect?: boolean;
}

export interface ToolInput {
  questions: Question[];
  answers?: Record<string, string>;
}

export interface ToolOutput {
  questions?: Question[];
  answers: Record<string, string>;
}

// --- Core logic (exported for testing) ---

/**
 * Detect whether the decision was auto-answered by PreToolUse or human-answered.
 *
 * If `answers` is present and non-empty in the INPUT, the PreToolUse hook
 * pre-filled answers via `updatedInput`. Otherwise, human answered.
 */
export function detectTag(input: ToolInput): "auto" | "human" {
  if (input.answers && Object.keys(input.answers).length > 0) {
    return "auto";
  }
  return "human";
}

/**
 * Format a structured markdown log entry for one HITL decision.
 */
export function formatLogEntry(
  input: ToolInput,
  output: ToolOutput,
  tag: "auto" | "human",
): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push(`## ${timestamp}`);
  lines.push("");
  lines.push(`**Tag:** ${tag}`);
  lines.push("");

  for (const q of input.questions) {
    lines.push(`### Q: ${q.question}`);
    lines.push("");

    if (q.options && q.options.length > 0) {
      const labels = q.options.map((o) => o.label).join(", ");
      lines.push(`**Options:** ${labels}`);
      lines.push("");
    }

    const answer = output.answers?.[q.question] ?? "(no answer)";
    lines.push(`**Answer:** ${answer}`);
    lines.push("");
  }

  return lines.join("\n");
}

// --- File Permission Types ---

export interface FilePermissionInput {
  file_path: string;
  content?: string;
  old_string?: string;
  new_string?: string;
  [key: string]: unknown;
}

// --- File Permission Detection ---

/**
 * Detect whether raw parsed JSON is a Write/Edit tool input (has file_path).
 */
export function isFilePermissionInput(raw: unknown): raw is FilePermissionInput {
  if (raw === null || typeof raw !== "object") return false;
  return "file_path" in (raw as Record<string, unknown>);
}

/**
 * Infer tool name from input structure.
 * Edit has old_string; Write has content or just file_path.
 */
export function inferToolName(input: FilePermissionInput): "Write" | "Edit" {
  if ("old_string" in input) return "Edit";
  return "Write";
}

/**
 * Detect the permission tag from PostToolUse output.
 *
 * - "auto-deny": output indicates the tool was blocked/denied
 * - "deferred": output indicates human intervention
 * - "auto-allow": default — PostToolUse fired and tool succeeded
 */
export function detectFilePermissionTag(output: string): "auto-allow" | "auto-deny" | "deferred" {
  const lower = output.toLowerCase();
  if (lower.includes("denied") || lower.includes("blocked") || lower.includes('"deny"')) {
    return "auto-deny";
  }
  if (lower.includes("user approved")) return "deferred";
  return "auto-allow";
}

/**
 * Format a structured markdown log entry for a file permission decision.
 * Distinct from AskUserQuestion format but coexists in the same file.
 */
export function formatFilePermissionLogEntry(
  toolName: string,
  filePath: string,
  tag: "auto-allow" | "auto-deny" | "deferred",
): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push(`## ${timestamp}`);
  lines.push("");
  lines.push(`**Tag:** ${tag}`);
  lines.push("");
  lines.push(`**Tool:** ${toolName}`);
  lines.push("");
  lines.push(`**File:** ${filePath}`);
  lines.push("");
  lines.push(`**Decision:** ${tag}`);
  lines.push("");

  return lines.join("\n");
}

// --- CLI entry point ---

if (import.meta.main) {
  try {
    const phase = process.argv[2];
    if (!phase) {
      process.exit(0);
    }

    const rawInput = process.env.TOOL_INPUT;
    const rawOutput = process.env.TOOL_OUTPUT;
    if (!rawInput || !rawOutput) {
      process.exit(0);
    }

    const input: ToolInput = JSON.parse(rawInput);
    const output: ToolOutput = JSON.parse(rawOutput);

    if (!input.questions || input.questions.length === 0) {
      process.exit(0);
    }

    const tag = detectTag(input);
    const entry = formatLogEntry(input, output, tag);

    // Resolve log path relative to git repo root
    const repoRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
    }).trim();
    const logPath = resolve(
      repoRoot,
      ".beastmode",
      "artifacts",
      phase,
      "hitl-log.md",
    );

    // Ensure directory exists
    const logDir = dirname(logPath);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    // Append entry (creates file if missing)
    appendFileSync(logPath, entry + "\n");
  } catch {
    // Silent exit — hook failure must never block Claude
  }
  process.exit(0);
}
