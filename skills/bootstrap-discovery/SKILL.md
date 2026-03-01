---
name: bootstrap-discovery
description: Autonomous parallel codebase analysis to generate .agent/prime/*.md docs. Spawns 5 Explore agents simultaneously for STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING. Merges findings with existing content. Use after /bootstrap on existing projects.
---

# /bootstrap-discovery

Autonomous codebase analysis with parallel agents. Analyzes project and populates `.agent/prime/*.md` files.

## Prerequisite

Verify `.agent/prime/` exists. If missing: "Run `/bootstrap` first to create the .agent/ structure."

## Execution Flow

```yaml
1. Read Current State:
   - Read all 5 prime files
   - Store content for agent prompts

2. Spawn 5 Agents (parallel):
   - STACK, STRUCTURE, CONVENTIONS, ARCHITECTURE, TESTING
   - Use Agent tool with subagent_type: Explore, model: haiku
   - Each gets: role + hints + current content + output schema

3. Collect Results:
   - Wait for all agents
   - Parse JSON responses

4. Merge & Write:
   - Apply merge strategy per section
   - Write to .agent/prime/{FILE}.md

5. Update CLAUDE.md:
   - Generate one-liner summaries
   - Update Rules Summary section

6. Complete:
   - List updated files
   - Offer to commit
```

## Agent Invocation

Spawn all 5 agents in a single message for parallel execution:

```yaml
Agent:
  subagent_type: Explore
  model: haiku
  description: "Analyze STACK"
  prompt: |
    [STACK agent prompt - see references/agent-prompts.md]

    Current STACK.md content:
    [paste current content]

Agent:
  subagent_type: Explore
  model: haiku
  description: "Analyze STRUCTURE"
  prompt: |
    [STRUCTURE agent prompt - see references/agent-prompts.md]

    Current STRUCTURE.md content:
    [paste current content]

# ... CONVENTIONS, ARCHITECTURE, TESTING agents
```

## Output Schema

Each agent returns JSON:

```json
{
  "prime": "STACK",
  "confidence": "high",
  "sections": {
    "Core Stack": {
      "action": "replace",
      "content": "**Runtime:**\n- Language: TypeScript 5.4\n- Runtime: Bun 1.2"
    },
    "Key Dependencies": {
      "action": "merge",
      "content": "| zod | Schema validation |"
    }
  },
  "sources": ["package.json", "tsconfig.json"]
}
```

## Merge Strategy

| Action | Behavior |
|--------|----------|
| `replace` | Overwrite section with new content |
| `merge` | Append to existing (tables, lists) |
| `keep` | Leave existing unchanged |

### Placeholder Detection

Agents identify placeholders by patterns:
- `[e.g., ...]` — example placeholder
- `[what it's used for]` — instruction placeholder
- `[command]` — empty placeholder
- `<!-- Fill in ... -->` — comment placeholder

Sections with only placeholders → `action: replace`

## Error Handling

- Agent timeout → skip prime, log warning
- Malformed JSON → skip, preserve existing
- Empty response → preserve existing

## Safety Rules

- **Never read:** `.env`, `*.pem`, `credentials*`, `secrets*`, `*.key`
- **Always cite:** Include source files in response
- **Mark uncertainty:** Use confidence levels

## References

- [references/common-instructions.md](references/common-instructions.md) - Output format and safety rules (include in all prompts)
- [references/stack-agent.md](references/stack-agent.md) - STACK agent prompt
- [references/structure-agent.md](references/structure-agent.md) - STRUCTURE agent prompt
- [references/conventions-agent.md](references/conventions-agent.md) - CONVENTIONS agent prompt
- [references/architecture-agent.md](references/architecture-agent.md) - ARCHITECTURE agent prompt
- [references/testing-agent.md](references/testing-agent.md) - TESTING agent prompt

## Workflow

Part of: bootstrap → **bootstrap-discovery** → prime → research → design → plan → implement
