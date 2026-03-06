@PRODUCT.md
@CONTEXT.md
@META.md
@STATE.md

## Knowledge Hierarchy

Every level follows the same pattern: summary + section summaries of children + @imports to the next level down.

- **L0**: Domain entry points (PRODUCT.md, CONTEXT.md, META.md, STATE.md) — always loaded at boot via this file
- **L1**: Phase summaries (`{domain}/{PHASE}.md`) — loaded by phase skills during prime
- **L2**: Detail files (`{domain}/{phase}/{detail}.md`) — full topic detail + "Related Decisions" linking to L3
- **L3**: State artifacts (`state/{phase}/{date}-{feature}.md`) — raw design docs, plans, validation records, release notes

**State exception:** State has no L2 layer. L0 (STATE.md) → L1 (phase indices) → L3 (artifacts). State is a timeline, not a knowledge tree.

**Loading model:** L0 at boot, L1 by phase during prime. Phases pull only what they need.

**L2 size limit:** 500 lines max. Split into new L2 file if exceeded.

## Writing Guidelines

- **Use absolute directives** — Start with "NEVER" or "ALWAYS" for non-negotiable rules
- **Lead with why** — Explain rationale before solution (1-3 bullets max)
- **Be concrete** — Include actual commands/code for project-specific patterns
- **Minimize examples** — One clear point per code block
- **Bullets over paragraphs** — Keep explanations concise
- **Action before theory** — Put immediate takeaways first

**Anti-Bloat:**
- Don't add "Warning Signs" to obvious rules
- Don't show bad examples for trivial mistakes
- Don't write paragraphs explaining what bullets can convey

## File Conventions

- **UPPERCASE.md** — Invariant meta files (always exist, same structure)
- **lowercase.md** — Variant files (plans, research docs, date-prefixed)

## Meta Domain Structure

Each phase has three L2 category files: sops.md, overrides.md, learnings.md.

**Auto-promotion**: When a learning appears in 3+ date-headed sections, retro proposes promoting it to SOP (requires approval).

**HITL Gates**:
- `retro.learnings-write` | INTERACTIVE — auto-appended
- `retro.sops-write` | APPROVAL — requires explicit approval
- `retro.overrides-write` | APPROVAL — requires explicit approval

## Bottom-Up Retro Bubble

3-checkpoint retro walks L2 → L1 → L0: update detail, re-summarize parent, re-summarize grandparent. Verify linked files exist, prune stale entries, add new.
