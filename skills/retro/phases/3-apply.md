# 3. Apply Changes

## 0. Enter Cycle Worktree

Read worktree from most recent status file and change into it:

```bash
# Find most recent status file
status_file=$(ls -t .agents/status/*.md 2>/dev/null | head -1)

# Extract worktree path
worktree_path=$(grep -A1 "^## Worktree" "$status_file" | grep "Path:" | sed 's/.*Path:\s*//' | tr -d '`')

if [ -n "$worktree_path" ] && [ -d "$worktree_path" ]; then
  cd "$worktree_path"
fi
```

## 1. Apply Approved Updates

For each approved change, add the learning to the appropriate meta phase file's "## Learnings" section:

| Finding Category | Target File |
|-----------------|-------------|
| Implementation patterns, agent safety, git workflow | `.beastmode/meta/IMPLEMENT.md` |
| Naming conventions, code style, anti-patterns | `.beastmode/meta/PLAN.md` |
| Architecture, components, data flow, design decisions | `.beastmode/meta/DESIGN.md` |
| Testing strategy, coverage patterns | `.beastmode/meta/VALIDATE.md` |
| Release workflow, commit patterns | `.beastmode/meta/RELEASE.md` |

Format learnings as bullet points under the "## Learnings" section:

```markdown
## Learnings

- **[YYYY-MM-DD] Brief title**: Description of the learning or improvement
```

## 2. Verify Changes

For each updated file:
- Verify the learning is placed in the correct "## Learnings" section
- Ensure it doesn't duplicate existing learnings

## 3. Optional: Engineering Dance Off

For substantial changes, run the deep analysis phase:
- [references/engineering-dance-off.md](../references/engineering-dance-off.md)

## 4. Suggest Next Step

```
Meta learnings recorded!

No commit yet — all changes will be committed together at /release.

Ready to ship?
/release
```

**Do NOT commit.** Unified commit at /release.

## 5. Session Tracking

@../_shared/session-tracking.md

## 6. Context Report

@../_shared/context-report.md
