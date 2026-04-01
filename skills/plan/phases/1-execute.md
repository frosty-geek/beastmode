# 1. Execute

## 1. Explore Codebase

Understand:
- Existing patterns, conventions, and architecture
- Module boundaries and interfaces
- Test structure and commands
- Dependencies and build tools

## 2. Identify Durable Architectural Decisions

Before slicing into features, identify high-level decisions that span the entire design and are unlikely to change during implementation:

- Route structures and API contracts
- Schema shapes and data models
- Authentication and authorization approach
- Service boundaries and module interfaces
- Shared infrastructure choices
- Deep modules (per Ousterhout's *A Philosophy of Software Design*): look for opportunities where a simple, narrow interface can hide significant implementation complexity. Prefer modules whose public surface rarely changes even as internals evolve. Flag shallow modules — those whose interface is nearly as complex as their implementation — as candidates for consolidation or redesign.

These become cross-cutting constraints that every feature must honor.

## 3. Decompose PRD into Features

Break the PRD into thin vertical slices. Each feature cuts through all relevant layers end-to-end.

Rules:
1. Each feature should be independently implementable
2. Features should map to user stories from the PRD
3. Avoid deep dependencies between features where possible
4. If a decision can be answered by exploring the codebase, explore instead of asking
5. If a question requires research (unfamiliar technology, external APIs), research inline using Explore agent with `@../../agents/common-researcher.md` — save findings to `.beastmode/artifacts/research/YYYY-MM-DD-<topic>.md`
6. Scope guardrail: new capabilities get deferred
   "That sounds like its own design — I'll note it as a deferred idea."
7. Track deferred ideas internally

For each feature, capture:
- **Name:** short slug (lowercase, hyphenated)
- **User Stories:** which PRD user stories this feature covers
- **What to Build:** architectural description of what needs to happen (no file paths or code)
- **Acceptance Criteria:** how to verify this feature is done
- **Wave:** proposed execution wave (1 = foundation, higher = depends on earlier waves)

### Wave Assignment

When multiple features exist, propose wave groupings based on dependency analysis:
- **Wave 1:** Foundation features — no dependencies on other features
- **Wave 2:** Features that consume or extend wave 1 outputs
- **Wave 3+:** Integration features, cross-cutting concerns

Rules:
- Single-feature plans: assign wave 1 automatically
- Features with no inter-feature dependencies: same wave (parallel execution)
- Assign waves based on dependency analysis
- Wave number is the sole ordering primitive — no explicit dependency graph between features

## 4. Finalize Features

- Apply YAGNI — remove unnecessary scope
- Verify all features have user stories, descriptions, and acceptance criteria
- Self-review: check feature boundaries make sense, no overlaps, no gaps
