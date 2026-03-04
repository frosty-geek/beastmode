# 0. Prime

## 1. Announce Skill

"I'm using the /design skill to help turn your idea into a design."

## 2. Load Project Context

Read (if they exist):
- `.beastmode/PRODUCT.md`
- `.beastmode/context/DESIGN.md`
- `.beastmode/meta/DESIGN.md`

## 3. Check Research Trigger

Research triggers if ANY:

**Keyword Detection** — arguments contain:
- "research", "investigate", "explore first"
- "what's SOTA", "best practices", "how do people"

**Complexity Assessment** — topic involves:
- Unfamiliar technology or domain
- External API/service integration
- User expresses uncertainty

If triggered:
1. Extract topic from arguments
2. Spawn Explore agent with `@../../agents/researcher.md`
3. Save findings to `.agents/research/YYYY-MM-DD-<topic>.md`
4. Summarize findings to user
5. Continue with design
