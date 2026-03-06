# Design Context

Architecture, technology decisions, and product definition for beastmode. The system follows a plugin architecture on Claude Code with markdown-first skill definitions, git worktree isolation for implementation, and a knowledge hierarchy organized across Context, Meta, and State domains.

## Product
Product vision, capabilities, and differentiators. Beastmode turns Claude Code into a disciplined engineering partner with five-phase workflow, context persistence, self-improving retro loop, and progressive knowledge hierarchy.
design/product.md

## Architecture
System design with L0/L1/L2/L3 knowledge hierarchy, tiered L2 domain taxonomy (universal/high-frequency/specialized), three data domains (Context/State/Meta), worktree isolation for implementation, squash-per-release commits, two-tier HITL gate system, retro-driven L2 domain promotion, and artifact-based context persistence across sessions.
design/architecture.md

## Tech Stack
Claude Code plugin platform with markdown + YAML frontmatter for skill definitions. No runtime dependencies — pure agentic workflow system interpreted directly by Claude Code.
design/tech-stack.md
