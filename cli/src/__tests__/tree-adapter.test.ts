import { describe, test, expect } from "vitest";
import { toFlatTreeState } from "../tree-view/adapter.js";
import { createTreeState, addEntry, openPhase } from "../tree-view/tree-state.js";


describe("toFlatTreeState", () => {
  test("converts empty state", () => {
    const state = createTreeState();
    const flat = toFlatTreeState(state);
    expect(flat.epics).toEqual([]);
    expect(flat.cli.entries).toEqual([]);
  });

  test("converts system entries to cli entries", () => {
    const state = createTreeState();
    addEntry(state, "info", {}, "system message");
    const flat = toFlatTreeState(state);
    expect(flat.cli.entries.length).toBe(1);
    expect(flat.cli.entries[0].message).toBe("system message");
    expect(flat.cli.entries[0].level).toBe("info");
    expect(typeof flat.cli.entries[0].seq).toBe("number");
  });

  test("converts epic with phase entries (flattened)", () => {
    const state = createTreeState();
    openPhase(state, "my-epic", "plan");
    addEntry(state, "info", { epic: "my-epic", phase: "plan" }, "planning stuff");
    const flat = toFlatTreeState(state);
    expect(flat.epics.length).toBe(1);
    expect(flat.epics[0].slug).toBe("my-epic");
    // Phase entries become epic direct entries with phase tag
    expect(flat.epics[0].entries.length).toBe(1);
    expect(flat.epics[0].entries[0].message).toBe("planning stuff");
    expect(flat.epics[0].entries[0].phase).toBe("plan");
  });

  test("converts epic with feature entries (flattened from phase)", () => {
    const state = createTreeState();
    openPhase(state, "my-epic", "implement");
    addEntry(state, "info", { epic: "my-epic", phase: "implement", feature: "feat-a" }, "coding");
    const flat = toFlatTreeState(state);
    expect(flat.epics[0].features.length).toBe(1);
    expect(flat.epics[0].features[0].slug).toBe("feat-a");
    expect(flat.epics[0].features[0].entries.length).toBe(1);
    expect(flat.epics[0].features[0].entries[0].message).toBe("coding");
    expect(flat.epics[0].features[0].entries[0].phase).toBe("implement");
  });

  test("preserves entry ordering via seq", () => {
    const state = createTreeState();
    openPhase(state, "my-epic", "plan");
    addEntry(state, "info", { epic: "my-epic", phase: "plan" }, "first");
    addEntry(state, "info", { epic: "my-epic", phase: "plan" }, "second");
    const flat = toFlatTreeState(state);
    const entries = flat.epics[0].entries;
    expect(entries[0].seq).toBeLessThan(entries[1].seq);
  });

  test("handles multiple epics", () => {
    const state = createTreeState();
    openPhase(state, "epic-a", "plan");
    openPhase(state, "epic-b", "implement");
    addEntry(state, "info", { epic: "epic-a", phase: "plan" }, "a-msg");
    addEntry(state, "info", { epic: "epic-b", phase: "implement" }, "b-msg");
    const flat = toFlatTreeState(state);
    expect(flat.epics.length).toBe(2);
    expect(flat.epics[0].slug).toBe("epic-a");
    expect(flat.epics[1].slug).toBe("epic-b");
  });
});
