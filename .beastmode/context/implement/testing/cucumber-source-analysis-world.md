# Cucumber Source-Analysis World Pattern

**Context:** Dashboard wiring integration tests (2026-04-04)

For Ink/React terminal UI components, React rendering in Cucumber is heavyweight and error-prone (jsdom doesn't support Ink's terminal output model). The source-analysis World pattern avoids rendering entirely.

## Pattern

Create a Cucumber World class that:

1. Reads actual source files as strings via `readFileSync` at test time
2. Exposes parsed properties (imports, JSX tags, constants, percentages) via helper methods
3. Imports pure runtime functions (color engines, formatters) directly for behavioral assertions
4. Uses regex extraction for structural properties (prop values, interval constants, layout percentages)

**Decision:** No component rendering — tests verify structural source properties and pure function behavior instead.

**Rationale:** Ink components render to terminal escape sequences, not DOM nodes. Source analysis gives deterministic, fast assertions for structural compliance (correct import, correct JSX tag, correct prop) without any rendering infrastructure. Pure functions (color cycling, clock formatting) are imported and called directly for behavioral assertions.

## Implementation Conventions

- World class file: `features/support/<domain>-world.ts`
- Hooks file: `features/support/<domain>-hooks.ts` (Before calls `setup()` + `loadRuntime()`)
- Step definitions: `features/step_definitions/<domain>-wiring.steps.ts`
- Profile entry in `cucumber.json` with explicit import list (world, hooks, steps)

## Boundary

Use source analysis for: import presence, JSX component tags, prop wiring, constant values, layout percentages, component structure.

Use direct function calls for: pure utility functions (color engines, formatters, calculators) where runtime behavior matters.

Do NOT use for: state machine transitions, async side effects, multi-component interaction flows — those require integration with actual runtime behavior.

## Step Definition Convention

When steps don't need to compute in the When clause (the check happens in Then), write the When as a semantic no-op with a comment:

```typescript
When("I check the top-level layout component", function (this: DashboardWorld) {
  // Analysis happens in Then steps — this is a semantic marker
});
```

This keeps the Gherkin readable without forcing artificial state storage in the World.
