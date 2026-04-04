import { describe, test, expect } from "bun:test";
import { PHASE_COLOR, CHROME, DEPTH, isDim } from "../dashboard/monokai-palette.js";

describe("monokai-palette", () => {
  test("PHASE_COLOR has all 8 phase/status entries", () => {
    expect(Object.keys(PHASE_COLOR).sort()).toEqual([
      "blocked",
      "cancelled",
      "design",
      "done",
      "implement",
      "plan",
      "release",
      "validate",
    ]);
  });

  test("phase colors match Monokai Pro hex values", () => {
    expect(PHASE_COLOR.design).toBe("#AB9DF2");
    expect(PHASE_COLOR.plan).toBe("#78DCE8");
    expect(PHASE_COLOR.implement).toBe("#FFD866");
    expect(PHASE_COLOR.validate).toBe("#A9DC76");
    expect(PHASE_COLOR.release).toBe("#FC9867");
    expect(PHASE_COLOR.done).toBe("#A9DC76");
    expect(PHASE_COLOR.cancelled).toBe("#FF6188");
    expect(PHASE_COLOR.blocked).toBe("#FF6188");
  });

  test("CHROME has border, title, watchRunning, watchStopped, muted", () => {
    expect(CHROME.border).toBe("#727072");
    expect(CHROME.title).toBe("#78DCE8");
    expect(CHROME.watchRunning).toBe("#A9DC76");
    expect(CHROME.watchStopped).toBe("#FF6188");
    expect(CHROME.muted).toBe("#727072");
  });

  test("isDim returns true for done and cancelled", () => {
    expect(isDim("done")).toBe(true);
    expect(isDim("cancelled")).toBe(true);
  });

  test("isDim returns false for active phases", () => {
    expect(isDim("design")).toBe(false);
    expect(isDim("plan")).toBe(false);
    expect(isDim("implement")).toBe(false);
    expect(isDim("validate")).toBe(false);
    expect(isDim("release")).toBe(false);
    expect(isDim("blocked")).toBe(false);
  });

  test("DEPTH has chrome and panel background colors", () => {
    expect(DEPTH.chrome).toBe("#403E41");
    expect(DEPTH.panel).toBe("#353236");
  });
});
