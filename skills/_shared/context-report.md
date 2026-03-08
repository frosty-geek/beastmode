# Context Report

At the end of this phase, print a visual context report.

@visual-language.md

## What to Print

Render a single code block containing:
1. **Phase indicator** — current workflow position (from visual-language.md)
2. **Context bar** — 30-char bar with percentage and estimated total (from visual-language.md)

After the code block, print as plain text:
3. **Handoff guidance** — one of the three exact handoff strings from visual-language.md, based on context percentage

> **DO NOT** include next-step commands, transition guidance, or session-restart instructions in the context report. The transition gate handles what to do next. The context report only describes context state.
