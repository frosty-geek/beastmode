# Workflow

Phase workflow patterns, cross-phase coordination, and lifecycle decisions. Phase lifecycle, session tracking, context reports, parallel execution, retro agents, release git workflow, persona system, and autonomous chaining.

## Phase Lifecycle
Five-phase core workflow: design -> plan -> implement -> validate -> release. Each phase follows sub-phase anatomy: prime -> execute -> validate -> checkpoint. Standalone utilities: /beastmode (init), /status. Retro runs within each checkpoint.

1. ALWAYS follow five-phase core: design -> plan -> implement -> validate -> release
2. ALWAYS suggest next phase at checkpoint completion
3. NEVER skip phases

## Session Tracking
Each phase appends to `.beastmode/status/YYYY-MM-DD-<feature>.md` on completion. Status files record executed phases, session file paths, and retro findings. Shared reference `skills/_shared/session-tracking.md` provides the template.

1. ALWAYS update status file on phase completion
2. ALWAYS record session file paths for retro agent inspection

## Context Reports
Shared template `skills/_shared/context-report.md` imported at the end of each phase skill. Reports token usage, loaded artifacts, phase position, and handoff options.

1. ALWAYS include context report @import at end of each phase skill

## Parallel Execution
/implement executes tasks in parallel batches of up to 3 independent tasks. No per-task commits. Batch selection algorithm filters pending tasks with no unmet dependencies.

1. ALWAYS batch independent tasks for parallel execution in /implement
2. NEVER commit during /implement execute phase — defer to /release

## Retro Agents
Retro agents walk the L1/L2 hierarchy dynamically instead of using hardcoded file lists. Context walker parses @imports from L1 files to discover L2 review targets. Meta walker classifies findings as SOPs, overrides, or learnings. Both agents receive session context from the retro orchestrator.

1. ALWAYS pass L1 paths (not hardcoded file lists) to retro agents
2. ALWAYS include session context block in agent prompts

## Release Git Workflow
Releases use `git merge --squash` to collapse feature branches into one commit per version on main. Feature branch tips archived as `archive/feature/<name>` tags before deletion. Commit messages use GitHub release style with Features/Fixes/Artifacts sections.

1. ALWAYS archive feature branch tip before squash merge
2. ALWAYS use GitHub release style commit messages

## Persona System
Centralized character definition in `skills/_shared/persona.md` imported by all 0-prime.md files. Context-aware greetings factor in time of day and project state.

1. ALWAYS import persona.md in 0-prime.md announce steps
2. NEVER hardcode announce strings — use persona-voiced instructions

## Autonomous Chaining
Config.yaml transitions section controls phase-to-phase chaining. When set to auto, phases chain via Skill() calls with context threshold check. All retro gates must be configurable for fully autonomous cycles.

1. ALWAYS check context threshold before auto-chaining
2. ALWAYS respect gate mode from config.yaml — never skip gates
