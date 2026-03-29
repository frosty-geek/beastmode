---
phase: plan
epic: slim-down-design
feature: remove-prior-decisions-gate
---

# Remove Prior Decisions Gate

**Design:** `.beastmode/artifacts/design/2026-03-29-slim-down-design.md`

## User Stories

1. As a designer, I want the design interview to start without accumulated rules shaping my options, so that each feature gets fresh, unconstrained thinking.
2. As a designer, I want context/meta files still loaded for background awareness, so that I'm not completely blind to the project's history.
3. As a maintainer, I want the config entry removed cleanly, so that there's no dead configuration lingering in config.yaml.

## What to Build

Remove the prior-decisions gate from the design skill's prime phase. The gate currently extracts ALWAYS/NEVER rules from context and meta DESIGN.md files and applies them as invisible constraints on the design interview. The removal involves:

- Delete the entire `[GATE|design.prior-decisions]` section from the prime phase, including both gate options (human and auto)
- Renumber the subsequent steps so the sequence remains contiguous (Express Path Check and Existing Design Choice move up)
- Delete the `prior-decisions: auto` config entry from the `gates.design` section in the config file
- Leave the "Load Project Context" step completely unchanged — it still reads context/meta DESIGN.md for general awareness

The execute phase's context loading is also unaffected.

## Acceptance Criteria

- [ ] The `[GATE|design.prior-decisions]` section no longer exists in the design prime phase file
- [ ] Steps after the removed section are renumbered contiguously (no gaps)
- [ ] The `prior-decisions` key no longer exists under `gates.design` in config.yaml
- [ ] config.yaml parses as valid YAML after the change
- [ ] The "Load Project Context" step still reads context/DESIGN.md and meta/DESIGN.md
- [ ] Running `/design` on a test topic produces no prior-decisions gate log output
