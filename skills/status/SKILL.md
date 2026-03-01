---
name: status
description: Track current project state and milestones. Reads/writes .agent/status/.
---

# /status

View and manage session status files.

## Overview

Display current session status, list all sessions, or show specific session details.

**Announce:** "I'm using the /status skill to check session status."

## Arguments

```
/status              # Show current/most recent session
/status list         # List all session files
/status <feature>    # Show specific session status
```

## Commands

### Default (no args)
Show the most recently modified status file in `.agent/status/`.

### list
List all status files with their features and dates:
```bash
ls -lt .agent/status/*.md 2>/dev/null
```

### <feature>
Show status for a specific feature:
```bash
cat .agent/status/*-<feature>.md 2>/dev/null
```

## Output Format

When displaying status, show:
- Feature name and date
- Executed phases with timestamps
- Current phase (last in list)
- Link to Claude session for each phase

## Output

Reads from: `.agent/status/`

## Workflow

Part of: bootstrap → prime → research → design → plan → implement → **status** → verify → release → retro
