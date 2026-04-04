# Plan Skill Integration Tasks

## Goal

Modify the plan skill's Execute phase to spawn the plan-integration-tester agent after feature decomposition (step 3) and before finalization (step 4). On agent success, generate a wave-1 `integration-tests` feature and bump all other features' wave numbers. On agent failure, warn and continue.

## Architecture

- The plan skill is a markdown skill file (`skills/plan/SKILL.md`) — no TypeScript, no unit tests
- The plan-integration-tester agent is already defined at `.claude/agents/plan-integration-tester.md`
- The integration artifact path follows convention: `.beastmode/artifacts/plan/YYYY-MM-DD-<epic-name>-integration.md`
- The integration-tests feature follows standard feature plan format with YAML frontmatter
- Wave bumping is a simple +1 on all existing features' wave numbers
- Agent failure (NEEDS_CONTEXT or BLOCKED) triggers warn-and-continue, not a hard gate

## Tech Stack

- Markdown skill files (no code compilation)
- Claude Code Agent tool for subagent spawning
- Standard beastmode artifact conventions

## File Structure

- **Modify:** `skills/plan/SKILL.md` — Add step 3.5 (spawn agent + generate feature) between current steps 3 and 4 of Execute phase

---

### Task 1: Add Integration Test Generation Step to Plan Skill Execute Phase

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `skills/plan/SKILL.md`

- [x] **Step 1: Add new Execute step between Decompose and Finalize**

Insert a new `### 4. Generate Integration Tests` section between the current `### 3. Decompose PRD into Features` and `### 4. Finalize Features`. Renumber `### 4. Finalize Features` to `### 5. Finalize Features`.

The new section contains two sub-steps: spawning the agent and generating the feature.

Edit `skills/plan/SKILL.md` to insert after the closing of step 3 (after the wave assignment rules block ending with `- Wave number is the sole ordering primitive — no explicit dependency graph between features`) and before step 4 (`### 4. Finalize Features`):

```markdown
### 4. Generate Integration Tests

After feature decomposition, spawn the plan-integration-tester agent to produce behavioral integration specs for the epic.

#### 4a. Spawn Agent

Spawn the `plan-integration-tester` agent as a subagent:

- **Agent:** `plan-integration-tester` (from `.claude/agents/plan-integration-tester.md`)
- **Input:** Epic name and the numbered user stories extracted from the PRD
- **Method:** `Agent(subagent_type="general-purpose", prompt=<built prompt>)` — the prompt instructs the agent to follow the plan-integration-tester agent definition

The agent reads the existing test tree, analyzes coverage against the PRD user stories, and produces an integration artifact at `.beastmode/artifacts/plan/YYYY-MM-DD-<epic-name>-integration.md`.

**Handle agent status:**

- **DONE or DONE_WITH_CONCERNS:** proceed to step 4b (generate feature)
- **NEEDS_CONTEXT or BLOCKED:** print a warning and skip integration test generation entirely. Proceed to step 5 (Finalize Features). This is warn-and-continue — not a hard gate.

#### 4b. Generate Integration-Tests Feature

On agent success, generate a dedicated `integration-tests` feature:

1. **Read the integration artifact** produced by the agent
2. **Extract scenarios** from the artifact's "New Scenarios" and "Modified Scenarios" sections
3. **Create the feature** with these properties:
   - **Name:** `integration-tests`
   - **User Stories:** same user stories covered by the integration artifact's scenarios
   - **What to Build:** reference the integration artifact path; the implementer writes `.feature` files, step definitions, and configures the test runner
   - **Acceptance Criteria:** one criterion per Gherkin scenario in the artifact (e.g., "Scenario X passes as an integration test")
   - **Wave:** 1 (before all other features)
4. **Bump wave numbers** — increment all other features' wave numbers by 1 to accommodate the new wave-1 feature

The plan skill does not contain BDD domain knowledge — it delegates entirely to the agent and mechanically transforms the artifact into a feature.
```

Then renumber the current step 4 to step 5:

Change `### 4. Finalize Features` to `### 5. Finalize Features`.

- [x] **Step 2: Verify the edit is correct**

Read the modified `skills/plan/SKILL.md` and verify:
- The new step 4 appears between step 3 (Decompose) and step 5 (Finalize)
- Step numbering is sequential: 1, 2, 3, 4, 5
- The agent spawn instructions reference `plan-integration-tester`
- The warn-and-continue behavior is specified for NEEDS_CONTEXT and BLOCKED
- The feature generation specifies wave 1 and wave bumping
- The finalize step is now numbered 5

- [x] **Step 3: Commit**

```bash
git add skills/plan/SKILL.md
git commit -m "feat(plan-skill): add integration test generation step to execute phase"
```
