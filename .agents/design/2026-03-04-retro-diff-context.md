# Retro Diff Context

## Problem

The phase retro's Context Agent reviews `.beastmode/context/` docs for accuracy against session artifacts, but has no visibility into what actually changed in the codebase during the feature. This means structural drift — renamed files, removed directories, new skills — goes undetected until someone manually audits the docs.

## Solution

Feed the feature's git diff to the Context Agent. The agent already looks for staleness and accuracy. With the diff in hand, it will naturally notice when changes contradict what the docs claim.

## Change

**[skills/_shared/retro.md](skills/_shared/retro.md)** — When gathering context for the Context Agent, include a summary of changes made during this feature:

```
## Changes This Feature
{git diff --stat main...HEAD}
```

The agent compares this against the context docs it already reviews and flags discrepancies.

## Scope

- 1 file modified: `skills/_shared/retro.md`
- No new agents, skills, or phases
- No changes to agent prompts or common instructions — the agent already knows to check for staleness
