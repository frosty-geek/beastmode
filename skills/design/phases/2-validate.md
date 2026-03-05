# 2. Validate

## 1. Completeness Check

Verify design covers:
- [ ] Goal statement
- [ ] Approach summary
- [ ] Key decisions with rationale
- [ ] Component breakdown
- [ ] Files affected
- [ ] Testing strategy (if applicable)
- [ ] Locked decisions clearly marked
- [ ] Claude's Discretion areas identified
- [ ] Acceptance criteria present
- [ ] Deferred ideas captured (or "none")

If missing sections, go back to Execute phase.

## 2. Anti-Pattern Check

If the design produced fewer than 3 decisions, print:

"This is a lightweight design — that's fine. Even simple designs benefit from explicit approval to prevent wasted implementation."

Do NOT skip approval. Short designs still need the gate.

## 3. Gate: design.design-approval

Read `.beastmode/config.yaml` → check `gates.design.design-approval`.
Default: `human`. Execute ONLY the matching option below.
Remove non-matching options from the task list.

### 3.1 human — User Approval

Ask: "Does this design look complete? Ready to document?"

Options:
- Yes, document it
- No, let's revise [specify what]

Wait for user response before continuing.

### 3.2 auto — Self-Approve

Log: "Gate `design.design-approval` → auto: approved"
Proceed to checkpoint.
