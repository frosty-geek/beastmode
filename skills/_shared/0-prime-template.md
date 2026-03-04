# 0. Prime

## 1. Announce Skill

"I'm using the /{skill-name} skill to {skill-purpose}."

## 2. Load Project Context

Read (if they exist):
- `.beastmode/PRODUCT.md` (L0)
- `.beastmode/context/{PHASE}.md` (L1)
- `.beastmode/meta/{PHASE}.md` (L1)

## 3. Check Research Trigger (Optional)

Research triggers if ANY:

**Keyword Detection** — arguments contain:
- "research", "investigate", "explore first"
- "what's SOTA", "best practices", "how do people"

**Complexity Assessment** — topic involves:
- Unfamiliar technology or domain
- External API/service integration
- User expresses uncertainty

If triggered, spawn Explore agent with `@../../agents/researcher.md`.

## 4. Phase-Specific Setup

<!-- Each skill adds its own context loading here -->
