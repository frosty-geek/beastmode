# Escalation Ladder — Tasks

## Goal

Add a three-tier model escalation ladder (haiku -> sonnet -> opus) to the implement skill's controller dispatch logic. Each task starts at haiku. When the implementer hits BLOCKED or quality review returns NOT_APPROVED with Critical/Important issues after exhausting retries at the current tier, the controller escalates to the next model tier. Escalation resets per task.

## Architecture

This is a markdown skill modification. The implement skill (`skills/implement/SKILL.md`) is a set of instructions that Claude follows when running `/implement`. The changes add:

1. Escalation state tracking (per-task tier index + retry counter)
2. Model parameter on implementer dispatch
3. Escalation trigger logic on BLOCKED and quality NOT_APPROVED
4. Updated report format showing model tier per task
5. Updated status summary with escalation count
6. Updated L1 context entry in `.beastmode/context/IMPLEMENT.md`

## Constraints (from design decisions)

- Three-tier ladder: `["haiku", "sonnet", "opus"]` — hardcoded, not configurable
- Only implementer agents get the `model` parameter — reviewers stay on default
- Per-task reset: each new task starts at haiku
- 2 retries per tier, max 6 total attempts per task
- NEEDS_CONTEXT and Spec FAIL do not trigger escalation
- Escalation triggers: BLOCKED (after 2 retries at tier), Quality NOT_APPROVED Critical/Important (after 2 review-fix cycles at tier)

## File Structure

- **Modify:** `skills/implement/SKILL.md` — Add escalation state, dispatch model param, trigger logic, report format updates
- **Modify:** `.beastmode/context/IMPLEMENT.md` — Add L1 context entry for model escalation

---

### Task 0: Add Escalation State and Guiding Principle

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `skills/implement/SKILL.md:14-21` (Guiding Principles section)
- Modify: `skills/implement/SKILL.md:83` (Phase 1: Execute, before ### 0. Write Plan)

- [x] **Step 1: Add escalation guiding principle**

In `skills/implement/SKILL.md`, in the Guiding Principles section (after line 20), add a new bullet:

```markdown
- **Model escalation** — start cheap (haiku), escalate on failure (sonnet, then opus)
```

- [x] **Step 2: Add escalation state initialization to the Execute phase preamble**

In `skills/implement/SKILL.md`, insert a new section between `## Phase 1: Execute` (line 83) and `### 0. Write Plan` (line 85). This section documents the per-task escalation state the controller maintains:

```markdown
### Escalation State

The controller maintains per-task escalation state:

- **Model ladder:** `["haiku", "sonnet", "opus"]`
- **Current tier index:** starts at 0 (haiku) for each new task
- **Tier retry counter:** starts at 0 for each new task, resets on escalation

When a task begins, reset both to zero. The tier index selects the model passed to the Agent tool's `model` parameter for implementer dispatch. Reviewer agents (spec-reviewer, quality-reviewer) do not receive a model parameter — they use the default model.
```

- [x] **Step 3: Verify the additions read correctly**

Read `skills/implement/SKILL.md` lines 14-100 and confirm:
- The guiding principle bullet is present and formatted consistently with neighbors
- The Escalation State section appears between `## Phase 1: Execute` and `### 0. Write Plan`
- No duplicate headings or broken markdown structure

- [x] **Step 4: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(escalation-ladder): add escalation state and guiding principle to implement skill"
```

---

### Task 1: Update Implementer Dispatch with Model Parameter

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `skills/implement/SKILL.md:148-156` (Section B. Dispatch Implementer)

- [x] **Step 1: Update the dispatch instruction**

In `skills/implement/SKILL.md`, find the `#### B. Dispatch Implementer` section. Replace the current spawn instruction:

```markdown
   2. Spawn: `Agent(subagent_type="beastmode:implement-implementer", prompt=<built prompt>)`
```

with:

```markdown
   2. Spawn: `Agent(subagent_type="beastmode:implement-implementer", model=<current tier from escalation state>, prompt=<built prompt>)`
```

- [x] **Step 2: Verify the change**

Read the Dispatch Implementer section and confirm the `model` parameter is included in the spawn instruction and references the escalation state tier.

- [x] **Step 3: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(escalation-ladder): add model parameter to implementer dispatch"
```

---

### Task 2: Add Escalation Trigger Logic to BLOCKED Handler

**Wave:** 2
**Depends on:** Task 0, Task 1

**Files:**
- Modify: `skills/implement/SKILL.md:158-172` (Section C. Handle Implementer Status, BLOCKED bullet)

- [x] **Step 1: Replace the BLOCKED handler**

In `skills/implement/SKILL.md`, find the BLOCKED bullet in the `#### C. Handle Implementer Status` section. Replace:

```markdown
   - **BLOCKED**: assess the blocker.
     - Can the controller provide more context? Re-dispatch with context.
     - Can the task be broken smaller? Split and re-dispatch.
     - Otherwise: mark task as blocked, report to user.
```

with:

```markdown
   - **BLOCKED**: assess the blocker and attempt re-dispatch with context or a smaller split. Track retries against the current tier's budget (2 retries per tier).
     - If retries at current tier < 2: re-dispatch with context or split at the same model tier.
     - If retries at current tier exhausted (2 attempts) and a higher tier exists: **escalate** — increment the tier index, reset the tier retry counter to 0, re-dispatch at the new model tier.
     - If retries exhausted at opus (top tier): mark task as BLOCKED, report to user. Maximum 6 total attempts reached.
```

- [x] **Step 2: Verify the change**

Read the Handle Implementer Status section and confirm the BLOCKED handler now includes escalation logic with tier retry tracking.

- [x] **Step 3: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(escalation-ladder): add escalation trigger to BLOCKED handler"
```

---

### Task 3: Add Escalation Trigger Logic to Quality Review Handler

**Wave:** 2
**Depends on:** Task 0, Task 1

**Files:**
- Modify: `skills/implement/SKILL.md:205-212` (Section E. Code Quality Review, NOT_APPROVED handler)

- [x] **Step 1: Replace the NOT_APPROVED Critical/Important handler**

In `skills/implement/SKILL.md`, find the `#### E. Code Quality Review` section. Replace:

```markdown
   **If NOT_APPROVED with Critical or Important issues**: re-dispatch implementer to fix.
   - Provide the quality-reviewer's issue list as context
   - After fix: re-dispatch quality-reviewer
   - Max 2 review cycles. After max: mark task as blocked, report to user
```

with:

```markdown
   **If NOT_APPROVED with Critical or Important issues**: re-dispatch implementer to fix.
   - Provide the quality-reviewer's issue list as context
   - After fix: re-dispatch quality-reviewer
   - Max 2 review-fix cycles at the current model tier. After exhausting cycles:
     - If a higher tier exists: **escalate** — increment the tier index, reset the tier retry counter to 0, re-dispatch implementer at the new model tier, then re-run the full review pipeline (spec compliance + quality)
     - If at opus (top tier): mark task as BLOCKED, report to user. Maximum quality review escalation reached.
```

- [x] **Step 2: Verify the change**

Read the Code Quality Review section and confirm the NOT_APPROVED handler now includes escalation logic.

- [x] **Step 3: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(escalation-ladder): add escalation trigger to quality review NOT_APPROVED handler"
```

---

### Task 4: Add Non-Escalation Clarification

**Wave:** 2
**Depends on:** Task 0

**Files:**
- Modify: `skills/implement/SKILL.md` (after Escalation State section from Task 0)

- [x] **Step 1: Add non-escalation note to Escalation State section**

After the Escalation State section added in Task 0 (which describes what triggers escalation), append a clarification paragraph:

```markdown
The following statuses do NOT trigger model escalation:
- **NEEDS_CONTEXT** — a context problem, not a model capability limitation. Provide context and re-dispatch at the same tier.
- **Spec review FAIL** — a requirement misunderstanding, not a model capability limitation. Re-dispatch implementer at the same tier.
- **Quality review NOT_APPROVED with only Minor issues** — treated as approved. No retry needed.
```

- [x] **Step 2: Verify**

Read the Escalation State section and confirm the non-escalation clarification is present.

- [x] **Step 3: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(escalation-ladder): add non-escalation clarification"
```

---

### Task 5: Update Report Format with Model Tier

**Wave:** 3
**Depends on:** Task 2, Task 3

**Files:**
- Modify: `skills/implement/SKILL.md:315-331` (Phase 3 Checkpoint, Implementation Report format)
- Modify: `skills/implement/SKILL.md:278-293` (Phase 2 Validate, Status Summary)
- Modify: `skills/implement/SKILL.md:499-516` (Reference section, Implementation Report Format)

- [x] **Step 1: Update the Implementation Report format in Phase 3 Checkpoint**

In `skills/implement/SKILL.md`, find the `### 1. Save Implementation Report` section. Replace the report template's Completed Tasks line:

```markdown
    - Task N: <description> — [clean | with concerns]
```

with:

```markdown
    - Task N: <description> (<model tier>) — [clean | with concerns | escalated from <prior tier>: <reason>]
```

- [x] **Step 2: Update the Status Summary in Phase 2 Validate**

In the Status Summary section, after the line `Total: N tasks, M review cycles, K concerns`, add:

```markdown

    Escalations: N tasks escalated (X to sonnet, Y to opus)
```

And add a note: "Omit the Escalations line if no tasks escalated."

- [x] **Step 3: Update the Reference section's Implementation Report Format**

In the Reference section's `### Implementation Report Format`, replace:

```markdown
    ## Completed Tasks
    - Task 0: Implementer agent — clean
    - Task 1: Spec reviewer agent — clean
    - Task 3: Controller update — with concerns (file size)
```

with:

```markdown
    ## Completed Tasks
    - Task 0: Implementer agent (haiku) — clean
    - Task 1: Implementer agent (sonnet) — clean (escalated from haiku: BLOCKED)
    - Task 3: Implementer agent (opus) — with concerns (escalated from sonnet: quality NOT_APPROVED)
```

And update the summary line:

```markdown
    **Summary:** 4 tasks completed (1 with concerns), 0 blocked, 6 review cycles, 2 escalations
```

- [x] **Step 4: Verify all three report format sections are updated consistently**

Read the three sections and confirm model tier appears in completed tasks, escalation count appears in status summary, and the reference example matches the new format.

- [x] **Step 5: Commit**

```bash
git add skills/implement/SKILL.md
git commit -m "feat(escalation-ladder): update report and status summary with model tier and escalation count"
```

---

### Task 6: Update L1 Context

**Wave:** 3
**Depends on:** Task 0

**Files:**
- Modify: `.beastmode/context/IMPLEMENT.md`

- [x] **Step 1: Add Model Escalation section to IMPLEMENT.md**

In `.beastmode/context/IMPLEMENT.md`, add a new section after the existing Agent Review Pipeline section:

```markdown
## Model Escalation
- Three-tier ladder: haiku -> sonnet -> opus — implementer agents only, reviewers stay on default model
- Per-task reset: each new task starts at haiku regardless of prior task's final tier
- 2 retries per tier, max 6 total attempts per task before BLOCKED
- Escalation triggers: implementer BLOCKED (after tier retry exhaustion), quality NOT_APPROVED Critical/Important (after review-fix cycle exhaustion at tier)
- Non-triggers: NEEDS_CONTEXT, spec review FAIL, quality NOT_APPROVED Minor — these are context/requirement issues, not model capability
- Implementation report shows model tier per completed task and escalation count in status summary

context/implement/agent-review-pipeline.md
```

- [x] **Step 2: Verify**

Read `.beastmode/context/IMPLEMENT.md` and confirm the Model Escalation section exists and is correctly placed.

- [x] **Step 3: Commit**

```bash
git add .beastmode/context/IMPLEMENT.md
git commit -m "feat(escalation-ladder): add model escalation L1 context entry"
```

---

## Acceptance Criteria Mapping

| Criterion | Task(s) |
|-----------|---------|
| Every implementer dispatch includes model parameter | Task 1 |
| First dispatch uses haiku regardless of prior task | Task 0 (per-task reset) |
| BLOCKED after 2 retries triggers escalation | Task 2 |
| Quality NOT_APPROVED Critical/Important after 2 cycles triggers escalation | Task 3 |
| NEEDS_CONTEXT and Spec FAIL do not trigger escalation | Task 4 |
| Opus exhaustion marks BLOCKED with no further escalation | Task 2, Task 3 |
| Maximum 6 total attempts per task | Task 0 (budget), Task 2, Task 3 |
| Reviewers do not receive model parameter | Task 0 (state section), Task 1 (only implementer gets it) |
| Report shows model tier per task | Task 5 |
| Status summary includes escalation count | Task 5 |
