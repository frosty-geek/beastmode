# Plan Inline Gherkin — Implementation Tasks

## Goal

Rewrite the plan skill's integration test generation step so that Gherkin scenarios are distributed inline into each feature plan (via a `## Integration Test Scenarios` section), instead of creating a dedicated Wave 1 `integration-tests` feature. Update the plan-integration-tester agent's input/output contract to receive features in a batch and return grouped per-feature scenarios.

## Architecture

- **Plan skill** (`skills/plan/SKILL.md`): Step 4 changes from "spawn agent with PRD stories → generate integration-tests feature with wave bump" to "collect features → spawn agent with feature batch → distribute scenarios inline into feature plans"
- **Plan-integration-tester agent** (`agents/plan-integration-tester.md`): Input changes from flat PRD user stories to features-with-stories batch. Output gains per-feature grouping headers in the New Scenarios section.
- **Feature plan template** (Reference section in SKILL.md): Gains a new optional `## Integration Test Scenarios` section between "What to Build" and "Acceptance Criteria"

## Tech Stack

- Markdown skill/agent definitions (no runtime code)
- Git for commits

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `skills/plan/SKILL.md` | Modify | Rewrite Step 4 (lines 118-151), update feature plan template (lines 303-335) |
| `agents/plan-integration-tester.md` | Modify | Update input contract, add per-feature grouping to output contract |

---

## Tasks

### Task 0: Update plan-integration-tester agent input/output contract

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `agents/plan-integration-tester.md:1-10` (What You Receive section)
- Modify: `agents/plan-integration-tester.md:36-50` (New Scenarios subsection of Produce Integration Artifact)

- [x] **Step 1: Update "What You Receive" section**

Replace the current input contract:

```markdown
## What You Receive

- The epic name
- The PRD's user stories (full text)
```

With the new batch input contract:

```markdown
## What You Receive

- The epic name
- A list of features, each with:
  - Feature name (lowercase, hyphenated identifier)
  - Associated user stories (the subset of PRD user stories this feature covers)
```

- [x] **Step 2: Update "New Scenarios" subsection to add per-feature grouping**

In section "3. Produce Integration Artifact", update the "New Scenarios" subsection. The current text says:

```markdown
#### New Scenarios

For each user story with no existing coverage, write a complete Gherkin feature block:
```

Replace with:

```markdown
#### New Scenarios

Organize new scenarios by feature. For each feature that has user stories with no existing coverage, write a section with the feature name as a heading, followed by the Gherkin feature block:

```markdown
### Feature: <feature-name>

Covers user stories [N, M].

​```gherkin
@<epic-name>
Feature: [descriptive feature name]

  Scenario: [behavioral description]
    Given [initial state]
    When [action]
    Then [expected outcome]
​```
```

The feature-name heading must match the feature name from the input exactly (lowercase, hyphenated). This allows the plan skill to mechanically distribute scenarios by matching headings to feature names.

For features with no behavioral scenarios (e.g., purely structural or infrastructure features), omit the feature section entirely — the plan skill handles the empty-section case.
```

- [x] **Step 3: Verify the edit is consistent**

Read the full `agents/plan-integration-tester.md` file and verify:
- "What You Receive" references features with their user stories (not flat PRD stories)
- "New Scenarios" section describes per-feature grouping with heading format
- Status Reporting section still references the artifact path (unchanged)
- Constraints section is unchanged

- [x] **Step 4: Commit**

```bash
git add agents/plan-integration-tester.md
git commit -m "feat(plan-inline-gherkin): update integration tester agent input/output contract"
```

---

### Task 1: Rewrite plan skill Step 4 for batch invocation and inline distribution

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `skills/plan/SKILL.md:118-151` (Step 4 section)

- [x] **Step 1: Replace Step 4 entirely**

Replace lines 118-151 (the entire `### 4. Generate Integration Tests` section including subsections 4a and 4b) with:

```markdown
### 4. Generate Integration Tests

After feature decomposition, spawn the plan-integration-tester agent to produce behavioral integration specs grouped by feature.

#### 4a. Collect Features

Build a feature batch from the decomposed features. For each feature, capture:
- Feature name (lowercase, hyphenated identifier)
- Associated user stories (the subset of PRD user stories this feature covers)

#### 4b. Spawn Agent

Spawn the `plan-integration-tester` agent as a subagent:

- **Agent:** `plan-integration-tester` (from `.claude/agents/plan-integration-tester.md`)
- **Input:** Epic name and the feature batch (each feature with its name and user stories)
- **Method:** `Agent(subagent_type="general-purpose", prompt=<built prompt>)` — the prompt instructs the agent to follow the plan-integration-tester agent definition

The agent reads the existing test tree, analyzes coverage against the feature-level user stories, and produces an integration artifact at `.beastmode/artifacts/plan/YYYY-MM-DD-<epic-name>-integration.md` with scenarios grouped by feature name.

**Handle agent status:**

- **DONE or DONE_WITH_CONCERNS:** proceed to step 4c (distribute scenarios)
- **NEEDS_CONTEXT or BLOCKED:** print a warning and skip integration test generation entirely. Proceed to step 5 (Finalize Features). This is warn-and-continue — not a hard gate.

#### 4c. Distribute Scenarios into Feature Plans

On agent success, read the integration artifact and distribute scenarios inline:

1. **Read the integration artifact** produced by the agent
2. **Parse per-feature sections** — match `### Feature: <feature-name>` headings in the "New Scenarios" section to the decomposed features
3. **For each feature:**
   - If matching scenarios exist: inject the Gherkin block into a `## Integration Test Scenarios` section in the feature's internal record
   - If no matching scenarios: inject an empty `## Integration Test Scenarios` section with a comment: `<!-- No behavioral scenarios produced for this feature -->`
   - If no matching scenarios: record a warning for the missing coverage
4. **Preserve the integration artifact** as an audit trail (do not delete it)

The plan skill does not contain BDD domain knowledge — it delegates entirely to the agent and mechanically distributes the artifact's per-feature sections into feature plans.
```

- [x] **Step 2: Verify the edit is consistent**

Read `skills/plan/SKILL.md` lines 115-160 and verify:
- Step 4 references the updated agent contract (features batch, not flat stories)
- No mention of creating an `integration-tests` feature
- No mention of wave bumping
- Step 4c describes inline distribution with per-feature matching
- Step 5 (Finalize Features) reference is preserved

- [x] **Step 3: Commit**

```bash
git add skills/plan/SKILL.md
git commit -m "feat(plan-inline-gherkin): rewrite plan step 4 for batch invoke and inline distribution"
```

---

### Task 2: Update feature plan template with Integration Test Scenarios section

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Modify: `skills/plan/SKILL.md:303-344` (Feature Plan Format reference section)

- [x] **Step 1: Add Integration Test Scenarios section to the template**

In the Feature Plan Format template (lines 309-335), add the `## Integration Test Scenarios` section between `## What to Build` and `## Acceptance Criteria`. The current template:

```markdown
## What to Build

[Architectural description of what needs to happen. Describe modules, interfaces, and interactions. Do NOT include specific file paths or code — /implement will discover those via codebase exploration.]

## Acceptance Criteria
```

Becomes:

```markdown
## What to Build

[Architectural description of what needs to happen. Describe modules, interfaces, and interactions. Do NOT include specific file paths or code — /implement will discover those via codebase exploration.]

## Integration Test Scenarios

[Optional. Gherkin scenarios distributed from the plan-integration-tester agent. If present, contains one or more tagged Gherkin feature blocks. If no scenarios were produced, contains a comment noting the absence.]

## Acceptance Criteria
```

- [x] **Step 2: Verify the edit is consistent**

Read the full Reference section of `skills/plan/SKILL.md` and verify:
- Template shows the three sections in order: What to Build → Integration Test Scenarios → Acceptance Criteria
- The Integration Test Scenarios description matches the format from Step 4c
- Guidelines section is unchanged

- [x] **Step 3: Commit**

```bash
git add skills/plan/SKILL.md
git commit -m "feat(plan-inline-gherkin): add integration test scenarios to feature plan template"
```
