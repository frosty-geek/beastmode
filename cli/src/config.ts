import { readFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

export interface GateConfig {
  [key: string]: "human" | "auto";
}

export interface GatesConfig {
  design?: GateConfig;
  plan?: GateConfig;
  implement?: GateConfig;
  validate?: GateConfig;
  retro?: GateConfig;
  release?: GateConfig;
}

export interface GitHubConfig {
  enabled: boolean;
  repo?: string;
  "project-name"?: string;
  "project-id"?: string;
  "project-number"?: number;
  "field-id"?: string;
  "field-options"?: Record<string, string>;
}

export type DispatchStrategy = "sdk" | "cmux" | "auto";

export interface CliConfig {
  interval?: number;
  "dispatch-strategy"?: DispatchStrategy;
}

export interface BeastmodeConfig {
  gates: GatesConfig;
  github: GitHubConfig;
  cli: CliConfig;
}

const DEFAULT_CONFIG: BeastmodeConfig = {
  gates: {},
  github: { enabled: false },
  cli: { interval: 60, "dispatch-strategy": "sdk" },
};

/**
 * Parse a simple YAML config file. Handles the flat/nested structure
 * of .beastmode/config.yaml without pulling in a full YAML library.
 */
function parseSimpleYaml(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.split("\n");
  const stack: { indent: number; obj: Record<string, unknown> }[] = [
    { indent: -1, obj: result },
  ];

  for (const line of lines) {
    // Skip comments and blank lines
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const indent = line.length - trimmed.length;
    const match = trimmed.match(/^([^:]+):\s*(.*)?$/);
    if (!match) continue;

    const key = match[1].trim();
    const rawValue = match[2]?.trim() ?? "";

    // Pop stack to find parent at correct indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1].obj;

    if (rawValue === "" || rawValue.startsWith("#")) {
      // Nested object
      const child: Record<string, unknown> = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else {
      // Leaf value — strip inline comments
      const value = rawValue.replace(/\s+#.*$/, "");
      if (value === "true") parent[key] = true;
      else if (value === "false") parent[key] = false;
      else if (/^\d+$/.test(value)) parent[key] = parseInt(value, 10);
      else parent[key] = value;
    }
  }

  return result;
}

export function loadConfig(projectRoot: string): BeastmodeConfig {
  const configPath = resolve(projectRoot, ".beastmode", "config.yaml");
  if (!existsSync(configPath)) {
    return { ...DEFAULT_CONFIG };
  }

  const content = readFileSync(configPath, "utf-8");
  const raw = parseSimpleYaml(content);

  const gates = (raw.gates ?? {}) as GatesConfig;
  const rawGithub = (raw.github ?? {}) as Record<string, unknown>;
  const github = {
    enabled: rawGithub.enabled === true,
    repo: (rawGithub.repo as string) ?? undefined,
    "project-name": (rawGithub["project-name"] as string) ?? undefined,
    "project-id": (rawGithub["project-id"] as string) ?? undefined,
    "project-number": (rawGithub["project-number"] as number) ?? undefined,
    "field-id": (rawGithub["field-id"] as string) ?? undefined,
    "field-options": rawGithub["field-options"]
      ? (rawGithub["field-options"] as Record<string, string>)
      : undefined,
  } satisfies GitHubConfig;
  const cli = {
    interval:
      ((raw.cli as Record<string, unknown>)?.interval as number) ??
      DEFAULT_CONFIG.cli.interval,
    "dispatch-strategy":
      (((raw.cli as Record<string, unknown>)?.["dispatch-strategy"] as string) ?? "sdk") as DispatchStrategy,
  } satisfies CliConfig;

  return { gates, github, cli };
}

export function resolveGateMode(
  config: BeastmodeConfig,
  gatePath: string,
): "human" | "auto" {
  const [phase, gate] = gatePath.split(".");
  const phaseGates = config.gates[phase as keyof GatesConfig];
  if (!phaseGates) return "auto";
  return phaseGates[gate] ?? "auto";
}

/**
 * Update specific fields in config.yaml while preserving comments and structure.
 * Patch is a nested object — only specified keys are modified.
 *
 * Example: updateConfig(root, { github: { repo: "owner/repo" } })
 */
export function updateConfig(
  projectRoot: string,
  patch: Record<string, Record<string, unknown>>,
): void {
  const configPath = resolve(projectRoot, ".beastmode", "config.yaml");
  const lines = existsSync(configPath)
    ? readFileSync(configPath, "utf-8").split("\n")
    : [];

  for (const [section, fields] of Object.entries(patch)) {
    for (const [key, value] of Object.entries(fields)) {
      const formattedValue = formatYamlValue(value);
      const keyPattern = new RegExp(`^(\\s+)${escapeRegex(key)}:\\s*`);
      const sectionPattern = new RegExp(`^${escapeRegex(section)}:`);

      // Find section
      let sectionIdx = lines.findIndex((l) => sectionPattern.test(l));
      if (sectionIdx === -1) {
        // Add section at end
        lines.push("", `${section}:`, `  ${key}: ${formattedValue}`);
        continue;
      }

      // Find key within section
      let keyIdx = -1;
      const sectionIndent = lines[sectionIdx].match(/^\s*/)?.[0].length ?? 0;
      for (let i = sectionIdx + 1; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trimStart();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const indent = line.length - trimmed.length;
        if (indent <= sectionIndent && trimmed.includes(":")) break; // left section
        if (keyPattern.test(line)) {
          keyIdx = i;
          break;
        }
      }

      if (keyIdx !== -1) {
        // Check if this is a map value (field-options)
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Remove old map entries
          const keyIndent = lines[keyIdx].match(/^\s*/)?.[0].length ?? 0;
          let endIdx = keyIdx + 1;
          while (endIdx < lines.length) {
            const l = lines[endIdx];
            const t = l.trimStart();
            if (!t || t.startsWith("#")) {
              endIdx++;
              continue;
            }
            const ind = l.length - t.length;
            if (ind <= keyIndent) break;
            endIdx++;
          }
          const indent = " ".repeat(keyIndent);
          const childIndent = " ".repeat(keyIndent + 2);
          const mapLines = Object.entries(
            value as Record<string, string>,
          ).map(([k, v]) => `${childIndent}${k}: ${formatYamlValue(v)}`);
          lines.splice(
            keyIdx,
            endIdx - keyIdx,
            `${indent}${key}:`,
            ...mapLines,
          );
        } else {
          // Replace value in place, preserve comment
          const match = lines[keyIdx].match(
            /^(\s+\S+:\s*)\S.*?(\s+#.*)?$/,
          );
          if (match) {
            lines[keyIdx] = `${match[1]}${formattedValue}${match[2] ?? ""}`;
          } else {
            const indent = lines[keyIdx].match(/^\s*/)?.[0] ?? "  ";
            lines[keyIdx] = `${indent}${key}: ${formattedValue}`;
          }
        }
      } else {
        // Find the end of the section to insert
        let insertIdx = sectionIdx + 1;
        for (let i = sectionIdx + 1; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trimStart();
          if (!trimmed || trimmed.startsWith("#")) {
            insertIdx = i + 1;
            continue;
          }
          const indent = line.length - trimmed.length;
          if (indent <= sectionIndent && trimmed.includes(":")) break;
          insertIdx = i + 1;
        }

        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          const mapLines = Object.entries(
            value as Record<string, string>,
          ).map(([k, v]) => `    ${k}: ${formatYamlValue(v)}`);
          lines.splice(insertIdx, 0, `  ${key}:`, ...mapLines);
        } else {
          lines.splice(insertIdx, 0, `  ${key}: ${formattedValue}`);
        }
      }
    }
  }

  writeFileSync(configPath, lines.join("\n"));
}

function formatYamlValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    // Quote strings that contain special chars
    if (/[:#{}[\],&*?|>!%@`]/.test(value) || value.includes(" ")) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return String(value);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Detect the GitHub repo from git remote, parsing HTTPS and SSH URLs.
 * Returns "owner/repo" or undefined if not a GitHub remote.
 */
export function detectRepo(projectRoot: string): string | undefined {
  try {
    const result = spawnSync("git", ["remote", "get-url", "origin"], {
      cwd: projectRoot,
      encoding: "utf-8",
      timeout: 5000,
    });
    if (result.status !== 0 || !result.stdout) return undefined;

    const url = result.stdout.trim();

    // HTTPS: https://github.com/owner/repo.git or https://github.com/owner/repo
    const httpsMatch = url.match(
      /github\.com\/([^/]+)\/([^/.]+?)(?:\.git)?$/,
    );
    if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;

    // SSH: git@github.com:owner/repo.git or git@github.com:owner/repo
    const sshMatch = url.match(
      /github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/,
    );
    if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;

    return undefined;
  } catch {
    return undefined;
  }
}
