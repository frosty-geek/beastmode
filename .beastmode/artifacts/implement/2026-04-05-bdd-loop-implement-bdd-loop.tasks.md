# Implement BDD Loop — Tasks

## Goal

Add a feature-level BDD loop to the implement skill. The implement phase will:
1. Generate Task 0 (integration test from Gherkin scenarios) as the first dispatched task
2. After all implementation tasks complete, re-run the integration test
3. On failure, analyze the output and re-dispatch the responsible task
4. Support model escalation (2× haiku, 2× sonnet, 2× opus = 6 retries)
5. Discover integration tests by convention (file naming, tags, describe blocks)

## Architecture

This feature modifies the implement SKILL.md (a prompt/instruction file that controls how Claude behaves as the implement phase controller) and supporting context files. No TypeScript code is produced — this is a skill-definition-only change.

## Design Constraints

- Per-feature integration tests, not a shared suite
- Integration test Gherkin scenarios live inline in the feature plan
- Task 0 is always the integration test, tasks 1-N are implementation
- BDD verification escalation state is independent from per-task escalation
- Convention-based test discovery: file naming, tags, describe blocks — no config file
- Budget: 6 total retries (2 per tier) at the BDD verification level

## File Structure

- **Modify:** `skills/implement/SKILL.md` — main implement skill definition. Add Task 0 pattern to Write Plan, add BDD Verification section after wave loop, update Escalation State docs, update Completion/Status Summary/Implementation Report sections.
- **Modify:** `.beastmode/context/implement/write-plan.md` — L2 context. Add Task 0 integration test section and convention-based discovery.
- **Modify:** `.beastmode/context/IMPLEMENT.md` — L1 context. Add BDD loop and Task 0 context entries.

---

### Task 0: Add Task 0 Pattern to Write Plan Step in SKILL.md

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `skills/implement/SKILL.md:91-129`

- [ ] **Step 1: Read the current Write Plan section**

Read `skills/implement/SKILL.md` lines 91-129 to confirm the exact text of the Write Plan step.

- [ ] **Step 2: Insert Task 0 pattern into the Write Plan step**

After the existing step 3 ("Explore codebase") and before step 4 ("Create tasks"), insert a new step that generates Task 0 from the feature plan's Gherkin section. Renumber subsequent steps.

Edit `skills/implement/SKILL.md`. Replace the section from step 4 through step 6 with:

```markdown
4. **Generate Task 0** — the integration test:
   - Read the feature plan's `## Integration Test Scenarios` section — extract the Gherkin scenarios
   - If the section exists, create Task 0 as the first task:
     - Task 0 creates a runnable integration test file from the Gherkin scenarios
     - The test must be runnable in isolation (feature-scoped, no cross-feature dependencies)
     - The test uses the project's existing test runner with naming convention for identification (e.g., `<feature-name>.integration.test.ts` or `<feature-name>.feature`)
     - The test is expected to FAIL after Task 0 (RED state) — the feature isn't implemented yet
     - Task 0 is always Wave 0 with no dependencies
   - If the section does not exist, skip Task 0 — proceed with tasks starting at Task 1
   - All implementation tasks start at Task 1 — Task 0 is reserved for the integration test
5. **Create implementation tasks** using the Task Format (see Reference section):
   - Map each aspect of "What to Build" to one or more tasks
   - Include exact file paths discovered from codebase exploration
   - Include complete code in steps — no placeholders
   - Assign wave numbers based on dependencies (minimum Wave 1 — Wave 0 is reserved for Task 0)
   - Include verification steps with expected output
6. **Write `.tasks.md`** to `.beastmode/artifacts/implement/YYYY-MM-DD-<epic-name>-<feature-name>.tasks.md`:

   The document has three sections and NO YAML frontmatter (the stop hook scans `artifacts/<phase>/` for `.md` files with frontmatter and generates `.output.json` — the `.tasks.md` must not trigger this):

   **Header section** — goal, architecture, tech stack, duplicated from the feature plan (not referenced). Makes the document self-contained for agents.

   **File Structure section** — every file to be created or modified with its responsibility. Decomposition decisions are locked here, before individual task definitions.

   **Task definitions** — bite-sized TDD tasks following the Task Format (see Reference section). Each task uses checkbox tracking for cross-session resume:

   ```markdown
   - [ ] **Step 1: Write the failing test**
   [complete test code]

   - [ ] **Step 2: Run test to verify it fails**
   Run: `[exact command]`
   Expected: FAIL with "[message]"
   ```

   The controller resumes from the first unchecked step (`- [ ]`).

7. **Self-review pass** — before proceeding to dispatch, verify the `.tasks.md`:
   - **Spec coverage**: every acceptance criterion from the feature plan maps to at least one task
   - **Placeholder scan**: grep for TBD, TODO, "add appropriate", "similar to Task N", ellipsis (`...`) in code blocks — these are plan failures
   - **Type/name consistency**: identifiers used across tasks are consistent (no typos, no renamed-but-not-updated references)
   - **Task 0 presence**: if the feature plan has `## Integration Test Scenarios`, verify Task 0 exists and produces a runnable test
   - Fix violations inline — no approval gate
```

- [ ] **Step 3: Update Parse Waves to handle Wave 0**

In the "Parse Waves" section (line 131-137), ensure Wave 0 is handled. The existing text says "default wave = 1 if omitted" which is fine — Task 0 will explicitly set Wave 0. No change needed if the wave parser already handles any integer. Verify and note.

- [ ] **Step 4: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(implement-bdd-loop): add Task 0 pattern to Write Plan step"
```

---

### Task 1: Add BDD Verification Section After Wave Loop in SKILL.md

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `skills/implement/SKILL.md:241-245`

- [ ] **Step 1: Read the Completion section**

Read `skills/implement/SKILL.md` lines 234-245 to confirm the exact text around the Completion section.

- [ ] **Step 2: Insert BDD Verification section**

Between the existing "### 3. Blocked Task Resolution" (line 234) and "### 4. Completion" (line 241), insert a new section. Renumber Completion to ### 5.

Edit `skills/implement/SKILL.md`. After the Blocked Task Resolution section and before Completion, insert:

```markdown
### 4. Feature-Level BDD Verification

After all waves complete (and before reporting completion), run the feature's integration test if Task 0 was dispatched.

#### A. Locate Integration Test

Find the integration test created by Task 0 using convention-based discovery:

1. **File naming:** Look for `<feature-name>.integration.test.ts` or `<feature-name>.feature` in the project's test directories
2. **Tags:** Look for `@<epic-name>` tag on Gherkin features
3. **Describe blocks:** Look for the feature name in describe/feature blocks

If no integration test is found (Task 0 was skipped because the feature plan had no Gherkin section), skip BDD verification entirely and proceed to Completion.

#### B. Run Integration Test

Execute the integration test in isolation:

```bash
# Use the project's test runner with the specific test file
# e.g., bun test <path-to-integration-test>
# or: npx cucumber-js --tags @<epic-name>
```

#### C. Handle Result

**If GREEN (pass):** Feature satisfies its acceptance criteria. Proceed to Completion.

**If RED (fail):** Enter the BDD retry loop.

#### D. BDD Retry Loop

The BDD retry loop uses an independent escalation state (separate from per-task escalation):

- **Model ladder:** `["haiku", "sonnet", "opus"]`
- **Budget:** 6 total retries (2 per tier)
- **Tier index:** starts at 0 (haiku)
- **Tier retry counter:** starts at 0, resets on escalation

For each retry:

1. **Analyze failure** — examine test assertions, stack traces, and error messages from the integration test output
2. **Identify responsible task** — map the failure to the most likely task based on:
   - Which task's files are referenced in the failure
   - Which task's acceptance criteria align with the failing assertion
   - Which task's implementation area covers the failing behavior
3. **Re-dispatch the responsible task** — build a new implementer prompt:
   - Append: original task instructions (from .tasks.md)
   - Append: integration test failure output
   - Append: failing test assertion details
   - Append: pre-read file contents for the task's files
   - Spawn: `Agent(subagent_type="beastmode:implement-dev", model=<current BDD tier>, prompt=<built prompt>)`
4. **Run the re-dispatched task through the review pipeline** (spec compliance + quality review)
5. **Re-run the integration test**

**After re-run:**
- **GREEN:** Stop retrying. Feature is done. Proceed to Completion.
- **RED:** Increment the BDD retry counter.
  - If retries at current tier < 2: retry at the same model tier (go to step 1)
  - If retries at current tier exhausted (2 attempts) and a higher tier exists: escalate — increment the BDD tier index, reset the BDD tier retry counter to 0, retry at the new tier (go to step 1)
  - If retries exhausted at opus (top tier): mark feature as failed. Report to user:
    ```
    BDD verification failed after 6 retries (2× haiku, 2× sonnet, 2× opus).
    Last failure: [test name] — [assertion message]
    Responsible task: Task N — [description]
    ```
    Proceed to Completion with failure status.
```

- [ ] **Step 3: Renumber Completion to ### 5**

Update the "### 4. Completion" heading to "### 5. Completion" and update its text to reference BDD verification:

```markdown
### 5. Completion

When all waves complete and BDD verification passes (or is skipped):
- Report: "Implementation complete. N tasks done, M review cycles. BDD verification: [passed | failed after K retries | skipped]."
- Proceed to validate phase.
```

- [ ] **Step 4: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(implement-bdd-loop): add BDD verification section after wave loop"
```

---

### Task 2: Update Escalation State Documentation in SKILL.md

**Wave:** 2
**Depends on:** Task 0, Task 1

**Files:**
- Modify: `skills/implement/SKILL.md:76-89`

- [ ] **Step 1: Read the Escalation State section**

Read `skills/implement/SKILL.md` lines 76-89 to confirm the current text.

- [ ] **Step 2: Add BDD verification escalation note**

After the existing escalation state documentation (line 89), append:

```markdown
### BDD Verification Escalation

The controller also maintains a separate BDD verification escalation state, used during the post-implementation integration test retry loop (see Phase 1, Step 4):

- **Model ladder:** `["haiku", "sonnet", "opus"]` (same ladder)
- **Budget:** 6 total retries (2 per tier)
- **Independence:** BDD verification escalation is fully independent from per-task escalation. A task that completed at haiku during initial dispatch may be re-dispatched at sonnet during BDD verification if the integration test keeps failing.

The BDD verification escalation resets to tier 0 (haiku) when a new BDD retry loop begins. It does NOT carry over from per-task escalation.
```

- [ ] **Step 3: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(implement-bdd-loop): document independent BDD verification escalation"
```

---

### Task 3: Update Status Summary and Implementation Report in SKILL.md

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `skills/implement/SKILL.md:281-357`

- [ ] **Step 1: Read the Status Summary section**

Read `skills/implement/SKILL.md` lines 281-303 to confirm the current text.

- [ ] **Step 2: Add BDD verification stats to Status Summary**

Update the status summary template to include BDD retry information. After the "Escalations" line, add:

```markdown
    BDD verification: [passed | failed after K retries | skipped (no Gherkin section)]
    BDD retries: K total (X× haiku, Y× sonnet, Z× opus)
```

Omit the BDD retries line if BDD verification passed on first run or was skipped.

- [ ] **Step 3: Read the Implementation Report section**

Read `skills/implement/SKILL.md` lines 313-357 to confirm the current text.

- [ ] **Step 4: Add BDD verification to Implementation Report**

In the Implementation Report template, add after the "**Concerns:** N" line:

```markdown
    **BDD verification:** [passed | passed after K retries | failed after K retries | skipped]
```

And add a new section after "## Blocked Tasks":

```markdown
    ## BDD Verification
    - Result: [passed | passed after K retries | failed after K retries | skipped]
    - Retries: N (haiku: X, sonnet: Y, opus: Z)
    - Last failure: [test name — assertion message] (if applicable)
    - Responsible task: Task N (if retries occurred)
```

If BDD verification passed on first run: "BDD verification passed — integration test GREEN after all tasks completed."
If skipped: "BDD verification skipped — no Integration Test Scenarios in feature plan."

- [ ] **Step 5: Update the Implementation Report Format reference section**

In the Reference section's "Implementation Report Format" (around line 508-525), add a BDD verification example:

```markdown
    ## BDD Verification
    - Result: passed after 3 retries
    - Retries: 3 (haiku: 2, sonnet: 1, opus: 0)
    - Last failure: auth-flow.integration.test.ts — "Expected token to be valid"
    - Responsible task: Task 3
```

- [ ] **Step 6: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(implement-bdd-loop): add BDD stats to status summary and implementation report"
```

---

### Task 4: Update Write Plan Context File

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `.beastmode/context/implement/write-plan.md`

- [ ] **Step 1: Read the current write-plan.md**

Read `.beastmode/context/implement/write-plan.md` to confirm its current contents.

- [ ] **Step 2: Add Task 0 and convention-based discovery sections**

Append the following sections to `write-plan.md`:

```markdown
## Task 0: Integration Test from Gherkin

- If the feature plan has a `## Integration Test Scenarios` section with Gherkin blocks, generate Task 0 as the first task
- Task 0 creates a runnable integration test file from the Gherkin scenarios
- Task 0 is always Wave 0 with no dependencies — executes before all implementation tasks
- The test must be feature-scoped and runnable in isolation
- The test is expected to FAIL after Task 0 (RED state) — the feature isn't implemented yet
- If no Gherkin section exists in the feature plan, skip Task 0 — tasks start at Task 1
- All implementation tasks start at Wave 1 minimum — Wave 0 is reserved for Task 0

## Convention-Based Test Discovery

- Integration tests are identified by convention, not configuration
- File naming: `<feature-name>.integration.test.ts` or `<feature-name>.feature`
- Tags: `@<epic-name>` on Gherkin features
- Describe blocks: feature name in the describe/feature block
- The implement skill uses these conventions to locate and run the correct integration test after all tasks complete
- No separate configuration file for test-to-feature mapping
```

- [ ] **Step 3: Commit**

```bash
git add .beastmode/context/implement/write-plan.md
git commit -m "feat(implement-bdd-loop): add Task 0 and convention discovery to write-plan context"
```

---

### Task 5: Update L1 Implementation Context

**Wave:** 2
**Depends on:** Task 0, Task 4

**Files:**
- Modify: `.beastmode/context/IMPLEMENT.md`

- [ ] **Step 1: Read the current IMPLEMENT.md**

Read `.beastmode/context/IMPLEMENT.md` to confirm its current contents.

- [ ] **Step 2: Add BDD loop entries**

After the "## Write Plan" section (line 60-67), add:

```markdown
## BDD Loop
- Write Plan generates Task 0 (integration test from Gherkin) as first task — RED state before implementation
- After all tasks complete, integration test is re-run — expects GREEN
- On failure: analyze output, identify responsible task, re-dispatch with failure context
- BDD verification escalation: independent from per-task escalation, same model ladder (haiku→sonnet→opus), 6 total retries
- Convention-based test discovery: file naming (`<feature>.integration.test.ts`), tags (`@<epic>`), describe blocks — no config file
- ALWAYS skip BDD verification if no Integration Test Scenarios section in feature plan

context/implement/write-plan.md
```

- [ ] **Step 3: Commit**

```bash
git add .beastmode/context/IMPLEMENT.md
git commit -m "feat(implement-bdd-loop): add BDD loop entries to L1 implementation context"
```

---

## Self-Review Checklist

### Spec Coverage

| Acceptance Criterion | Task |
|---|---|
| Write Plan always generates Task 0 from Gherkin section | Task 0 |
| Task 0 produces a runnable test that fails (RED) | Task 0 |
| All implementation tasks dispatch after Task 0 | Task 0 (Wave 0 for Task 0, Wave 1+ for others) |
| After all tasks, integration test is re-run | Task 1 (BDD Verification section) |
| If passes, proceed to checkpoint | Task 1 (step C) |
| If fails, analyze and identify responsible task | Task 1 (step D.1-D.2) |
| Re-dispatch with failure context | Task 1 (step D.3) |
| After re-dispatch, re-run integration test | Task 1 (step D.5) |
| 6 total retries: 2× haiku, 2× sonnet, 2× opus | Task 1 (step D), Task 2 |
| Escalation after 2 failures at tier | Task 1 (step D), Task 2 |
| Success at any retry stops loop | Task 1 (step D) |
| After 6 failures, mark feature as failed | Task 1 (step D) |
| Convention-based discovery (no config) | Task 1 (step A), Task 4 |
| BDD escalation independent from per-task | Task 2 |

### Placeholder Scan
- No TBD, TODO, or ellipsis in code blocks
- All code blocks contain complete content
- All file paths are exact

### Type/Name Consistency
- "Task 0" used consistently (not "task zero" or "Task-0")
- "BDD verification" used consistently (not "BDD loop" in some places and "integration test loop" in others)
- "Integration Test Scenarios" section name matches feature plan convention
