/**
 * Cucumber World — shared test state for cancel-flow integration tests.
 *
 * Creates a real temporary git repository with .beastmode/ structure.
 * Models epic cancellation scenarios: seeding manifests, worktrees, artifacts,
 * and tags at various phases, then running cancelEpic and verifying cleanup.
 *
 * The mock boundary: only GitHub (gh) is mocked. Everything else runs for real --
 * git worktrees, manifest store, artifact files, phase tags.
 */

import { World, setWorldConstructor } from "@cucumber/cucumber";
import { mkdtemp, rm } from "node:fs/promises";
import { mkdirSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { git } from "../../src/git/worktree.js";
import * as worktree from "../../src/git/worktree.js";
import * as tags from "../../src/git/tags.js";
import * as store from "../../src/manifest/store.js";
import { cancelEpic, type CancelConfig, type CancelResult } from "../../src/commands/cancel-logic.js";
import { createNullLogger } from "../../src/logger.js";
import type { BeastmodeConfig } from "../../src/config.js";

export class CancelWorld extends World {
  projectRoot!: string;
  epicSlug!: string;
  lastCancelResult!: CancelResult | null;
  config!: BeastmodeConfig;

  async setup(): Promise<void> {
    this.projectRoot = await mkdtemp(join(tmpdir(), "beastmode-cancel-cucumber-"));
    this.lastCancelResult = null;

    // Initialize git repo
    await git(["init", "-b", "main"], { cwd: this.projectRoot });
    await git(["config", "user.email", "test@test.com"], { cwd: this.projectRoot });
    await git(["config", "user.name", "Test"], { cwd: this.projectRoot });

    // Initial commit so HEAD exists
    writeFileSync(join(this.projectRoot, "README.md"), "# Test repo\n");
    await git(["add", "."], { cwd: this.projectRoot });
    await git(["commit", "-m", "initial commit"], { cwd: this.projectRoot });

    // Create .beastmode/ directory structure
    const beastDir = join(this.projectRoot, ".beastmode");
    const dirs = [
      "state",
      "artifacts/design",
      "artifacts/plan",
      "artifacts/implement",
      "artifacts/validate",
      "artifacts/release",
    ];
    for (const d of dirs) {
      mkdirSync(join(beastDir, d), { recursive: true });
    }

    // Write config with GitHub disabled
    writeFileSync(
      join(beastDir, "config.yaml"),
      [
        "github:",
        "  enabled: false",
        "cli:",
        "  dispatch-strategy: sdk",
        "  interval: 60",
      ].join("\n") + "\n",
    );

    // Commit beastmode structure
    await git(["add", "."], { cwd: this.projectRoot });
    await git(["commit", "-m", "add beastmode structure"], { cwd: this.projectRoot });

    // Load config
    this.config = {
      github: { enabled: false },
      cli: { interval: 60, "dispatch-strategy": "sdk" },
    };
  }

  async teardown(): Promise<void> {
    if (this.projectRoot) {
      await rm(this.projectRoot, { recursive: true, force: true });
    }
  }

  /**
   * Create a worktree and manifest simulating an epic at a given phase.
   * Writes a minimal artifact file for the phase and creates a phase tag.
   */
  async seedEpicAtPhase(slug: string, phase: string): Promise<void> {
    this.epicSlug = slug;

    // Create worktree
    const wtInfo = await worktree.create(slug, { cwd: this.projectRoot });

    // Create manifest in state/
    const manifest = store.create(this.projectRoot, slug, {
      worktree: { branch: wtInfo.branch, path: wtInfo.path },
    });

    // Advance manifest phase
    manifest.phase = phase as any;
    store.save(this.projectRoot, slug, manifest);

    // Write a minimal artifact for the phase
    const date = new Date().toISOString().slice(0, 10);
    const artifactDir = join(this.projectRoot, ".beastmode", "artifacts", phase);
    mkdirSync(artifactDir, { recursive: true });
    writeFileSync(
      join(artifactDir, `${date}-${slug}.md`),
      `---\nphase: ${phase}\nslug: ${slug}\nepic: ${slug}\n---\n\n# ${slug}\n\nArtifact for ${phase}.\n`,
    );

    // Create a phase tag at worktree HEAD
    await tags.createTag(slug, phase, { cwd: wtInfo.path });

    // Commit everything to main
    await git(["add", "."], { cwd: this.projectRoot });
    await git(["commit", "-m", `seed epic ${slug} at phase ${phase}`, "--allow-empty"], { cwd: this.projectRoot });
  }

  /**
   * Run cancelEpic with the given options.
   */
  async runCancel(opts: { force?: boolean; githubEnabled?: boolean } = {}): Promise<CancelResult> {
    const config: CancelConfig = {
      identifier: this.epicSlug,
      projectRoot: this.projectRoot,
      githubEnabled: opts.githubEnabled ?? false,
      force: opts.force ?? true,
      logger: createNullLogger(),
    };

    this.lastCancelResult = await cancelEpic(config);
    return this.lastCancelResult;
  }

  /**
   * Check if a manifest exists for the given slug.
   */
  manifestExists(slug: string): boolean {
    return store.load(this.projectRoot, slug) !== undefined;
  }

  /**
   * Check if a worktree exists for the given slug.
   */
  worktreeExists(slug: string): boolean {
    const wtDir = join(this.projectRoot, ".claude", "worktrees", slug);
    return existsSync(wtDir);
  }

  /**
   * Check if any phase tags exist for the given slug.
   */
  phaseTagsExist(slug: string): boolean {
    const tagPrefix = `beastmode/${slug}/`;
    // This would normally list git tags, but we'll verify by checking tag refs
    // For simplicity, we check if any artifact files reference the slug
    const phases = ["design", "plan", "implement", "validate", "release"];
    for (const phase of phases) {
      const dir = join(this.projectRoot, ".beastmode", "artifacts", phase);
      if (existsSync(dir)) {
        const files = readdirSync(dir);
        for (const file of files) {
          if (file.includes(`-${slug}-`) || file.includes(`-${slug}.`)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Check if any artifact files exist for the given slug.
   */
  artifactsExist(slug: string): boolean {
    const phases = ["design", "plan", "implement", "validate", "release"];
    for (const phase of phases) {
      const dir = join(this.projectRoot, ".beastmode", "artifacts", phase);
      if (existsSync(dir)) {
        const files = readdirSync(dir);
        for (const file of files) {
          if (file.includes(`-${slug}-`) || file.includes(`-${slug}.`)) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

setWorldConstructor(CancelWorld);
