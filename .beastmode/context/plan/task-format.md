# Task Format

Plan task format conventions for implementation plans. Tasks are decomposed from design components into wave-ordered, file-isolated units with complete code and exact commands.

## Task Structure
Each task has a heading (`### Task N: [Name]`), metadata fields (Wave, Depends-on, Parallel-safe), a Files section with exact paths (Create/Modify/Test with line ranges), numbered steps with complete code, and a verification step with expected output.

1. ALWAYS include Wave and Depends-on fields
2. ALWAYS include Files section with exact paths
3. ALWAYS include verification step with expected output
4. ALWAYS write complete code in steps — never "add validation" or similar

## Wave Ordering
Wave 1 runs before Wave 2, etc. Tasks in the same wave with no Depends-on can run in parallel if marked Parallel-safe. Depends-on creates ordering within a wave. Default wave is 1 if omitted.

1. ALWAYS assign wave numbers to tasks
2. ALWAYS declare dependencies with `Depends on: Task N` or `-` for none
3. NEVER assume parallel execution without Parallel-safe flag

## Parallel Safety
After all tasks are written, /plan's validate phase runs file isolation analysis: collects file paths per wave, checks for overlap, auto-resequences conflicting tasks to new waves, and marks safe waves with `Parallel-safe: true`. /implement verifies the flag at runtime before parallel dispatch.

1. Parallel-safe flag is written by /plan validation — never by the human planner
2. If two tasks in a wave share a file, the later task moves to Wave N+1
3. Single-task waves are not flagged (nothing to parallelize)

## Design Coverage
/plan validates that every design component maps to at least one plan task. Coverage table printed during validation. Missing components trigger a return to execute phase.

1. ALWAYS verify design coverage before approval
2. ALWAYS print coverage table showing component-to-task mapping
