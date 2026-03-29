---
phase: design
slug: slim-down-design
---

## Problem Statement

The design skill's prime phase includes a `[GATE|design.prior-decisions]` step that extracts ~59 ALWAYS/NEVER rules from `context/DESIGN.md` and `meta/DESIGN.md`, then applies them as invisible constraints on the design interview. This over-constrains fresh design thinking by biasing the conversation toward accumulated past decisions rather than letting the current feature's needs drive the design.

## Solution

Remove the `[GATE|design.prior-decisions]` step from `phases/0-prime.md` and delete the corresponding `design.prior-decisions` config entry from `.beastmode/config.yaml`. The prime phase continues to read `context/DESIGN.md` and `meta/DESIGN.md` for general awareness, but no longer extracts or applies prior decisions as constraints.

## User Stories

1. As a designer, I want the design interview to start without accumulated rules shaping my options, so that each feature gets fresh, unconstrained thinking.
2. As a designer, I want context/meta files still loaded for background awareness, so that I'm not completely blind to the project's history.
3. As a maintainer, I want the config entry removed cleanly, so that there's no dead configuration lingering in config.yaml.

## Implementation Decisions

- Remove step 3 (`[GATE|design.prior-decisions]`) from `skills/design/phases/0-prime.md`
- Renumber subsequent steps (4 → 3, 5 → 4)
- Delete `prior-decisions: auto` line from `gates.design` in `.beastmode/config.yaml`
- Step 2 ("Load Project Context") remains unchanged — still reads both DESIGN.md files
- The execute phase also reads these files as before — no change to execute

## Testing Decisions

- Verify that `config.yaml` parses correctly after the entry is removed
- Run `/design` on a test topic and confirm no prior-decisions gate log appears
- Confirm context/meta files are still read at prime (visible in conversation flow)

## Out of Scope

- Other phases' prior-decisions gates (plan, implement, validate, release) — unaffected
- Retro write-side behavior — retro still writes to context/DESIGN.md and meta/DESIGN.md as before; only the read-side contract in the design skill changes
- Pruning stale L2/L3 files
- Slimming the L1 DESIGN.md summary itself
- Slimming the interview decision tree

## Further Notes

None

## Deferred Ideas

None
