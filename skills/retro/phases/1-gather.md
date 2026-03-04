# 1. Gather Context

## 1. Check Quick Exit

If the session was short or routine with nothing notable, say "Nothing to improve" and end.

## 2. Read Session Artifacts

Gather from this cycle:
- Design docs in `.agents/design/`
- Plan docs in `.agents/plan/`
- Status records in `.agents/status/`
- Conversation history

## 3. Collect Context File Paths

From the status file, collect all file references for retro agents:

1. **Related artifacts** — Design and Plan doc paths from the Context section
2. **Session Files** — JSONL paths from the Session Files section

## 4. Identify Meta Phase Files

List all meta phase files that may receive learnings:

| Meta File | Learning Category |
|-----------|-------------------|
| `.beastmode/meta/DESIGN.md` | Architecture, components, data flow, design decisions |
| `.beastmode/meta/PLAN.md` | Naming conventions, code style, anti-patterns |
| `.beastmode/meta/IMPLEMENT.md` | Implementation patterns, agent safety, git workflow |
| `.beastmode/meta/VALIDATE.md` | Testing strategy, coverage patterns |
| `.beastmode/meta/RELEASE.md` | Release workflow, commit patterns |
