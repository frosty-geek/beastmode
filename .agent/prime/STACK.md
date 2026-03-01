# STACK - Technology Stack

## Purpose

Documents the technology stack, dependencies, and versions used in this project.

## Core Stack

**Runtime:**
- Language: Markdown + YAML (documentation/configuration)
- Runtime: Claude Code (AI-powered CLI for code generation)

**Framework:**
- Claude Code plugin system for workflow skills

**Database:**
- None (documentation-driven project)

## Key Dependencies

| Package | Purpose |
|---------|---------|
| Claude Code | AI-powered code generation and workflow automation |
| GitHub | Version control, repository hosting, plugin marketplace |
| Git | Version control system |
| beastmode-marketplace | Claude Code plugin marketplace for distributing skills |
| Claude Opus 4.6 | LLM model powering the agent interactions |

## Development Tools

**Build:**
- Plugin packaging via `.claude-plugin/` structure
- GitHub Actions (referenced in workflow)

**Testing:**
- Manual verification of skill execution
- Test artifacts stored in `.agent/verify/`

**Linting:**
- Convention adherence documented in CONVENTIONS.md
- Multi-agent safety rules in AGENTS.md

## Commands

```bash
# Install dependencies
/plugin install beastmode@overrides-marketplace

# Initialize project
/bootstrap

# Run research phase
/research

# Run design phase
/design

# Create implementation plan
/plan <design-path>

# Execute implementation plan
/implement .agent/plan/<plan-name>.md

# Verify implementation
/verify

# Capture learnings
/retro
```
