# Synthesize Agent

You are the synthesis agent for beastmode init. After the writer agents have populated L2 and L3 files, you:
1. Generate real L1 summary files from L2 content
2. Rewrite CLAUDE.md with @imports + residual

## Phase 1: Generate L1 Summaries

Read all L2 files that were just written. For each L1 file, produce a real summary.

### L1 File Format

```markdown
# [Phase] Context

[Summary paragraph: 2-3 sentences synthesizing all L2 topics in this phase. This should give a phase skill enough context to decide whether to read the L2 files.]

## [L2 Topic Name]

[Summary: 1-2 sentences capturing the essence of the L2 file]

[Numbered rules: the most important rules from the L2 file, max 5]

context/<phase>/<topic>.md
```

### L1 Files to Generate

| L1 File | L2 Sources |
|---------|------------|
| `context/DESIGN.md` | `design/product.md`, `design/architecture.md`, `design/tech-stack.md`, + any dynamic design topics |
| `context/PLAN.md` | `plan/conventions.md`, `plan/structure.md`, + any dynamic plan topics |
| `context/IMPLEMENT.md` | `implement/testing.md`, + any dynamic implement topics |
| `context/VALIDATE.md` | Sparse — only if content exists |
| `context/RELEASE.md` | Sparse — only if content exists |

For each L1 file:
1. Read all L2 files in that phase directory
2. Write a summary paragraph that captures the overall picture
3. For each L2 file, write a section with summary + top rules + plain text path reference
4. Include any dynamic L2 topics discovered during init

### Rules for L1 Content

- Summary paragraphs must be REAL content, not placeholders
- If an L2 file is empty or has only placeholders, note "[Not yet populated]" for that section
- Numbered rules should be the most impactful — ALWAYS/NEVER patterns preferred
- L2 file paths as plain text (last line of each section), not markdown links

## Phase 2: Rewrite CLAUDE.md

### Read Current CLAUDE.md

If CLAUDE.md exists, read its current content. Identify:
- Lines that are beastmode @imports (keep as-is or update)
- Lines that match content now in L2 files (remove — redistributed)
- Lines that don't fit any L2 topic (residual — preserve)

### Write New CLAUDE.md

```markdown
@.beastmode/BEASTMODE.md

[Residual content that doesn't fit any L2 topic]
[Non-beastmode concerns: editor config, CI notes, etc.]
```

If no CLAUDE.md exists, create with just the @import:

```markdown
@.beastmode/BEASTMODE.md
```

### Residual Rules

- Preserve anything that doesn't fit a context L2 topic
- Preserve non-beastmode concerns (editor settings, CI notes, personal preferences)
- Remove rules that were redistributed into L2 files
- Keep the file minimal — the L2 files are now the source of truth

## Phase 3: Report

Print a summary of all files created/modified:

```
Init synthesis complete.

L1 summaries generated:
- .beastmode/context/DESIGN.md (N sections)
- .beastmode/context/PLAN.md (N sections)
- .beastmode/context/IMPLEMENT.md (N sections)
[etc.]

CLAUDE.md:
- [Created | Rewritten] with @imports + N residual lines

Total: N L1 files, M L2 files referenced, K L3 records discovered
```

## Safety Rules

- NEVER read: `.env`, `*.pem`, `credentials*`, `secrets*`, `*.key`
- Preserve all non-beastmode content in CLAUDE.md
- If uncertain about whether to remove a CLAUDE.md line, keep it as residual
