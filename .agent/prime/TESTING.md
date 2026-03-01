# TESTING - Test Strategy

## Purpose

Documents the testing approach, commands, and conventions.

## Test Commands

```bash
# Note: This project is a workflow/documentation system.
# Traditional unit tests don't apply. Testing focuses on skill/agent validation.

# Verify skill definitions work
ls -la skills/*/SKILL.md && echo "All skills defined"

# Verify agent definitions work
ls -la agents/*.md && echo "All agents defined"

# Validate markdown syntax in templates and prime docs
find .agent/prime -name "*.md" -exec grep -l "^\[" {} \; # Find unfilled placeholders

# Manual skill testing (run each skill in Claude Code and verify output)
# Example: /bootstrap, /prime, /design, /plan
```

## Test Structure

**Integration Tests (Manual Workflow Validation):**
- Location: `.agent/verify/` (verification reports directory)
- Naming: `YYYY-MM-DD-<skill-name>-verification.md` (date-prefixed verification reports)
- Process: Execute each skill end-to-end in Claude Code and document results
- Scope: Prime document generation, skill orchestration, agent spawning

**Unit-like Tests (Template Validation):**
- Location: `skills/bootstrap/templates/` (golden master templates)
- Naming: `[SECTION].md` (uppercase meta files like STACK.md, TESTING.md)
- Validation: Confirm templates have section headers and are fillable by `/bootstrap-discovery`

## Conventions

**Test File Naming:**
- Verification reports: `YYYY-MM-DD-<feature>-verification.md` in `.agent/verify/`
- No traditional test files with `_test`, `.spec`, or `.test` suffixes

**Test Function Naming:**
- N/A - this is a documentation/workflow project without code functions
- Instead: Skill execution workflows documented in SKILL.md files

**Fixtures/Mocks:**
- Location: `skills/bootstrap-discovery/references/` (agent prompts and guidance)
- Usage: Each reference file (stack-agent.md, testing-agent.md, etc.) contains prompt templates used by discovery agents
- Agent invocation: Parallel spawning of 5 discovery agents in `bootstrap-discovery` skill

## Coverage

**Target:** 100% skill/agent coverage

**Critical Paths:**
- `/bootstrap` - MUST create `.agent/` structure without errors
- `/bootstrap-discovery` - MUST successfully spawn parallel agents and merge findings
- `/prime` - MUST load context correctly
- `/plan` - MUST generate actionable implementation plans with TDD structure
- `/implement` - MUST execute plans in isolated worktrees and merge cleanly
- Skills reference templates: MUST have correct structure for bootstrap-discovery merge strategy

## Verification Process

Validation occurs through:

1. **Skill Execution Testing** — Run each skill end-to-end in Claude Code
2. **Template Validation** — Verify bootstrap templates have proper section markers for merge strategy
3. **Agent Prompt Validation** — Confirm discovery agents can parse responses and merge content
4. **Workflow Continuity** — Verify output from one skill serves as input to next (e.g., prime → research → design → plan → implement)
5. **Placeholder Compliance** — Confirm generated `.agent/prime/*.md` files follow merge rules (preserve/fill/update actions)

## Test Execution Flow

The verification workflow follows this pattern:

1. **Manual skill test** — Run `/bootstrap` on a fresh project
2. **Bootstrap discovery** — Run `/bootstrap-discovery` and verify output merges with existing content
3. **Prime load** — Run `/prime` and confirm context loads correctly
4. **Multi-phase workflow** — Execute `/design`, `/plan`, `/implement` in sequence
5. **Report generation** — Document results in `.agent/verify/YYYY-MM-DD-<test>.md`

## Known Limitations

- No automated CI/CD testing (skills require Claude Code runtime)
- `/verify` skill is currently stubbed and not yet implemented
- Testing is manual and requires human judgment about workflow quality
- Agent responses are non-deterministic (requires human review of outputs)
