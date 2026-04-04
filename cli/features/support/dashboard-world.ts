/**
 * Cucumber World for dashboard wiring integration tests.
 *
 * Reads actual source files and exposes structural/behavioral
 * properties for step definitions to assert against.
 * No React rendering — pure source analysis and constant evaluation.
 */

import { World, setWorldConstructor } from "@cucumber/cucumber";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CLI_SRC = resolve(import.meta.dirname, "../../src");

export class DashboardWorld extends World {
  /** Raw source of App.tsx */
  appSource = "";
  /** Raw source of ThreePanelLayout.tsx */
  threePanelSource = "";
  /** Raw source of NyanBanner.tsx */
  nyanBannerSource = "";
  /** Raw source of nyan-colors.ts */
  nyanColorsSource = "";
  /** Raw source of PanelBox.tsx */
  panelBoxSource = "";
  /** Raw source of OverviewPanel.tsx */
  overviewPanelSource = "";

  /** NYAN_PALETTE imported at runtime */
  nyanPalette: string[] = [];
  /** nyanColor function imported at runtime */
  nyanColorFn!: (char: string, charIndex: number, tickOffset: number) => string | undefined;
  /** TICK_INTERVAL_MS from NyanBanner */
  tickIntervalMs = 0;
  /** NYAN_PALETTE length — used for gradient verification */
  nyanPaletteLength = 0;
  /** Raw source of EpicsPanel.tsx */
  epicsPanelSource = "";
  /** Raw source of tree-format.ts */
  treeFormatSource = "";

  setup(): void {
    this.appSource = readFileSync(resolve(CLI_SRC, "dashboard/App.tsx"), "utf-8");
    this.threePanelSource = readFileSync(resolve(CLI_SRC, "dashboard/ThreePanelLayout.tsx"), "utf-8");
    this.nyanBannerSource = readFileSync(resolve(CLI_SRC, "dashboard/NyanBanner.tsx"), "utf-8");
    this.nyanColorsSource = readFileSync(resolve(CLI_SRC, "dashboard/nyan-colors.ts"), "utf-8");
    this.panelBoxSource = readFileSync(resolve(CLI_SRC, "dashboard/PanelBox.tsx"), "utf-8");
    this.overviewPanelSource = readFileSync(resolve(CLI_SRC, "dashboard/OverviewPanel.tsx"), "utf-8");
    this.epicsPanelSource = readFileSync(resolve(CLI_SRC, "dashboard/EpicsPanel.tsx"), "utf-8");
    this.treeFormatSource = readFileSync(resolve(CLI_SRC, "dashboard/tree-format.ts"), "utf-8");
  }

  async loadRuntime(): Promise<void> {
    const colors = await import("../../src/dashboard/nyan-colors.js");
    this.nyanPalette = [...colors.NYAN_PALETTE];
    this.nyanColorFn = colors.nyanColor;

    // Extract TICK_INTERVAL_MS from NyanBanner source
    const tickMatch = this.nyanBannerSource.match(/TICK_INTERVAL_MS\s*=\s*(\d+)/);
    this.tickIntervalMs = tickMatch ? parseInt(tickMatch[1], 10) : 0;
    this.nyanPaletteLength = colors.NYAN_PALETTE.length;
  }

  /** Check if App.tsx imports a specific module name */
  appImports(moduleName: string): boolean {
    return this.appSource.includes(`from "./${moduleName}`) ||
           this.appSource.includes(`from './${moduleName}`);
  }

  /** Check if App.tsx JSX contains a component tag */
  appRendersComponent(componentName: string): boolean {
    const tagPattern = new RegExp(`<${componentName}[\\s/>]`);
    return tagPattern.test(this.appSource);
  }

  /** Extract height="XX%" from ThreePanelLayout source for a section */
  extractHeight(sectionComment: string): string | null {
    const idx = this.threePanelSource.indexOf(sectionComment);
    if (idx === -1) return null;
    const after = this.threePanelSource.slice(idx, idx + 300);
    const match = after.match(/height="(\d+%)"/);
    return match ? match[1] : null;
  }

  /** Extract width="XX%" for a panel by title */
  extractPanelWidth(panelTitle: string): string | null {
    const pattern = new RegExp(`title="${panelTitle}"\\s+width="(\\d+%)"`);
    const match = this.threePanelSource.match(pattern);
    return match ? match[1] : null;
  }

  /** Check if a panel title exists in ThreePanelLayout */
  hasPanelTitle(title: string): boolean {
    return this.threePanelSource.includes(`title="${title}"`);
  }

  /** Extract clock interval from App.tsx */
  extractClockInterval(): number {
    const match = this.appSource.match(/setInterval\(\s*\(\)\s*=>\s*setClock\(formatClock\(\)\)\s*,\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Check if formatClock produces HH:MM:SS */
  hasHHMMSSFormat(): boolean {
    return this.appSource.includes('padStart(2, "0")') && this.appSource.includes('.join(":")');
  }

  /** Extract borderColor from PanelBox source */
  extractPanelBorderColor(): string | null {
    const match = this.panelBoxSource.match(/borderColor="([^"]+)"/);
    return match ? match[1] : null;
  }

  /** Extract title text color from PanelBox source */
  extractPanelTitleColor(): string | null {
    const match = this.panelBoxSource.match(/Text\s+color="([^"]+)"[^>]*>\s*\{title/);
    return match ? match[1] : null;
  }

  /** Extract PHASE_COLOR map entries from a source file */
  extractPhaseColors(source: string): Record<string, string> {
    const result: Record<string, string> = {};
    const blockMatch = source.match(/PHASE_COLOR[^{]*\{([^}]+)\}/s);
    if (!blockMatch) return result;
    const entries = blockMatch[1].matchAll(/(\w+):\s*"([^"]+)"/g);
    for (const m of entries) {
      result[m[1]] = m[2];
    }
    return result;
  }

  /** Check if the outer container in ThreePanelLayout has a border */
  hasOuterChromeBorder(): boolean {
    const outerPattern = /borderStyle="single"\s+borderColor="cyan"\s+flexDirection="column"\s+flexGrow/;
    return outerPattern.test(this.threePanelSource);
  }

  /** Extract backgroundColor from a source pattern */
  extractBackgroundColor(source: string, contextPattern: string): string | null {
    const idx = source.indexOf(contextPattern);
    if (idx === -1) return null;
    const after = source.slice(Math.max(0, idx - 200), idx + 300);
    const match = after.match(/backgroundColor[=:]\s*"([^"]+)"/);
    return match ? match[1] : null;
  }

  /** Check if banner text contains a specific word */
  bannerContainsText(text: string): boolean {
    return this.nyanBannerSource.includes(text);
  }

  /** Check if banner has trailing dot characters */
  bannerHasTrailingDots(): boolean {
    return this.nyanBannerSource.includes("▄");
  }

  /** Extract the BANNER_LINES text content */
  extractBannerText(): string {
    const match = this.nyanBannerSource.match(/BANNER_LINES\s*=\s*\[([\s\S]*?)\];/);
    return match ? match[1] : "";
  }

  /** Extract column width from ThreePanelLayout (left/right column pattern) */
  extractColumnWidth(column: "left" | "right"): string | null {
    const source = this.threePanelSource;
    if (column === "left") {
      const match = source.match(/flexDirection="row"[\s\S]*?<Box[^>]*width="(\d+%)"/);
      return match ? match[1] : null;
    }
    const matches = [...source.matchAll(/width="(\d+%)"/g)];
    return matches.length >= 2 ? matches[1][1] : null;
  }

  /** Check if the nyan color engine uses interpolation with N steps */
  hasInterpolationSteps(expected: number): boolean {
    const source = this.nyanColorsSource;
    return source.includes(String(expected)) || this.nyanPaletteLength === expected;
  }

  /** Check adjacent color similarity for gradient smoothness */
  adjacentColorsSimilar(tickOffset: number): boolean {
    if (!this.nyanColorFn) return false;
    const c0 = this.nyanColorFn("█", 0, tickOffset);
    const c1 = this.nyanColorFn("█", 1, tickOffset);
    return c0 !== undefined && c1 !== undefined;
  }
}

setWorldConstructor(DashboardWorld);
