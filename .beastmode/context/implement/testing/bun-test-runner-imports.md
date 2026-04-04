# Bun Test Runner Imports

## Context
During structured-task-store validation, 4 new test files (`in-memory.test.ts`, `json-file-store.test.ts`, `resolve.test.ts`, `store.test.ts`) imported test utilities from `vitest` instead of `bun:test`. The tests passed syntax validation but would diverge at runtime. Caught and fixed during validate phase.

## Decision
All new test files in this project MUST import from `bun:test`, not `vitest`.

```typescript
// Wrong — vitest is not the runtime
import { describe, it, expect, beforeEach } from "vitest";

// Correct — project runs on Bun
import { describe, it, expect, beforeEach } from "bun:test";
```

## Rationale
The CLI uses Bun as its runtime. `bun test` executes files using the `bun:test` module. Agent-generated test files default to `vitest` because it is the dominant TypeScript test framework by mindshare. The divergence is not caught by TypeScript type-checking (both have compatible APIs) and only surfaces at validate time. Making it an explicit rule pre-empts the fix from being done repeatedly at the wrong phase.

## Source
.beastmode/artifacts/validate/2026-04-04-structured-task-store.md
