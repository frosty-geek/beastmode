# 2. Review Session for Learnings

## 1. Spawn Review Agents

Launch parallel agents to analyze the session for learnings. Use prompts from `agents/` directory:
- [agents/architecture.md](../agents/architecture.md) — findings go to `.beastmode/meta/DESIGN.md`
- [agents/conventions.md](../agents/conventions.md) — findings go to `.beastmode/meta/PLAN.md`
- [agents/agents.md](../agents/agents.md) — findings go to `.beastmode/meta/IMPLEMENT.md`
- [agents/testing.md](../agents/testing.md) — findings go to `.beastmode/meta/VALIDATE.md`
- [agents/stack.md](../agents/stack.md) — findings go to `.beastmode/meta/IMPLEMENT.md`
- [agents/structure.md](../agents/structure.md) — findings go to `.beastmode/meta/PLAN.md`

Use haiku model for cost efficiency.

**Include context files**: Append to each agent prompt:

```yaml
## Context Files
Read these files for context:

### Session Artifacts
<design doc path>
<plan doc path>

### Session Files (JSONL)
<list paths from gather phase>
```

## 2. Collect Findings

Each agent returns:
- Suggested updates (if any)
- Reasoning for changes
- No changes needed (if content is current)

## 3. Present Changes

Show user:
- Which files have suggested changes
- Summary of each change
- Ask for approval before applying
