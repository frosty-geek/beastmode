# Context Update — Implementation Tasks

## Goal

Update DESIGN.md (L2) Dashboard section and verify context/design/dashboard.md (L3) consistency so project documentation describes the three-panel layout model instead of the old push/pop drill-down architecture.

## Architecture

Documentation-only change. Two context files:
- `.beastmode/context/DESIGN.md` — L2 summary, Dashboard section (lines 107-123)
- `.beastmode/context/design/dashboard.md` — L3 detail (already updated in prior cycle)

The L2 section currently describes "k9s-style push/pop drill-down navigation across three views (EpicList, FeatureList, AgentLog) managed as a view stack" with "Five-zone chrome: header, breadcrumb bar, content area, activity log, key hints bar". The new model is a three-panel split screen (ThreePanelLayout with EpicsPanel, DetailsPanel, LogPanel slots), flat keyboard navigation via use-dashboard-keyboard, and an "(all)" aggregate view.

The Product line (line 6) also contains old dashboard language that needs updating.

## Acceptance Criteria (from feature plan)

- DESIGN.md Dashboard section describes three-panel layout, not push/pop drill-down
- DESIGN.md Dashboard section references ThreePanelLayout, EpicsPanel, DetailsPanel, LogPanel
- DESIGN.md Dashboard section references use-dashboard-keyboard, not useKeyboardController
- No references to view stack, CrumbBar, EpicList/FeatureList/AgentLog views in DESIGN.md Dashboard section
- dashboard.md L3 is consistent with DESIGN.md L2
- ALWAYS/NEVER rules in DESIGN.md updated to reflect flat navigation model

## File Structure

- **Modify:** `.beastmode/context/DESIGN.md` — Rewrite Dashboard section summary paragraph, update ALWAYS/NEVER rules, update Product line
- **Verify:** `.beastmode/context/design/dashboard.md` — Check L3 consistency with L2 rewrite

---

### Task 1: Rewrite DESIGN.md Dashboard Section

**Wave:** 1
**Depends on:** -

**Files:**
- Modify: `.beastmode/context/DESIGN.md:6` (Product line — dashboard description fragment)
- Modify: `.beastmode/context/DESIGN.md:107-123` (Dashboard section)

- [x] **Step 1: Update the Product line (line 6)**

Replace the dashboard description fragment in the Product line. The current text includes:

```
fullscreen TUI dashboard via `beastmode dashboard` (Ink v6 + React, k9s-style push/pop drill-down with view stack, live SDK streaming with message mapper and ring buffers, breadcrumb bar, context-sensitive key hints, keyboard navigation, inline epic cancellation, embedded watch loop, release queue indicator for held epics)
```

Replace with:

```
fullscreen TUI dashboard via `beastmode dashboard` (Ink v6 + React, three-panel layout with ThreePanelLayout/EpicsPanel/DetailsPanel/LogPanel slot composition, flat keyboard navigation via use-dashboard-keyboard, "(all)" aggregate view, live SDK streaming with message mapper and ring buffers, context-sensitive key hints, inline epic cancellation, embedded watch loop, release queue indicator for held epics)
```

- [x] **Step 2: Rewrite the Dashboard summary paragraph (line 108)**

Replace the current summary paragraph:

```
Fullscreen terminal UI (`beastmode dashboard`) built with Ink v6.8.0 + React with k9s-style push/pop drill-down navigation across three views (EpicList, FeatureList, AgentLog) managed as a view stack. Five-zone chrome: header, breadcrumb bar, content area, activity log, key hints bar. Content area renders one view at a time (full-screen replace, not split pane). SDK dispatch is forced at runtime (overriding config) to enable live structured message streaming via async generator iteration. A message mapper converts SDKMessage types to terminal-friendly log entries (text deltas inline, tool calls as one-liners). Ring buffers per session (~100 entries) collect continuously so history is available immediately on navigation. Context-sensitive key hints update per view type. Embedded watch loop via EventEmitter typed events. Signal handling externalized from WatchLoop.
```

Replace with:

```
Fullscreen terminal UI (`beastmode dashboard`) built with Ink v6.8.0 + React with three-panel split layout (ThreePanelLayout with EpicsPanel, DetailsPanel, LogPanel as slot children). k9s-style cyan chrome with single-line box-drawing characters and panel titles inset in top borders. Epics panel is the sole interactive panel — details and log are passive displays reacting to epic selection. Flat navigation model with "(all)" aggregate entry at top of epic list. Keyboard navigation via use-dashboard-keyboard (up/down in epics list, filter mode, cancel confirmation, toggle done/cancelled). SDK dispatch is forced at runtime (overriding config) to enable live structured message streaming via async generator iteration. A message mapper converts SDKMessage types to terminal-friendly log entries (text deltas inline, tool calls as one-liners). Ring buffers per session (~100 entries) collect continuously so history is available immediately on navigation. Context-sensitive key hints in bottom bar. Embedded watch loop via EventEmitter typed events. Signal handling externalized from WatchLoop.
```

- [x] **Step 3: Update ALWAYS/NEVER rules (lines 110-122)**

Replace rules 1-12 with updated rules reflecting the three-panel model:

```
1. ALWAYS use Ink v6 + React for fullscreen TUI rendering — Yoga flexbox handles terminal resize natively
2. ALWAYS use alternate screen buffer for clean entry and exit
3. ALWAYS embed the WatchLoop directly in the dashboard process — no separate watch process needed
4. ALWAYS use WatchLoop EventEmitter typed events for UI state updates — logger and React hooks are parallel subscribers
5. ALWAYS externalize signal handling from WatchLoop — Ink app's SIGINT handler calls `loop.stop()`, no conflicting handlers
6. ALWAYS share data logic (sorting, filtering, change detection) via `status-data.ts` — dashboard and status command use the same pure functions
7. ALWAYS use the same lockfile as `beastmode watch` — mutual exclusion prevents two orchestrators from running simultaneously
8. NEVER replace `beastmode watch` or `beastmode status --watch` — dashboard is an addition, not a replacement
9. ALWAYS use ThreePanelLayout with EpicsPanel, DetailsPanel, LogPanel as slot children — flat navigation, no drill-down or view stack
10. ALWAYS force SDK dispatch strategy when dashboard is running — message streams require SDK async generators, not terminal processes
11. ALWAYS allocate a ring buffer per dispatched SDK session — buffers collect continuously for instant history on navigation
12. ALWAYS use use-dashboard-keyboard for all keyboard input — single hook handles flat navigation, filter mode, cancel confirmation, and toggle
```

- [x] **Step 4: Verify no old references remain**

Run: `grep -n "push/pop\|drill-down\|view stack\|breadcrumb\|CrumbBar\|EpicList\|FeatureList\|AgentLog\|useKeyboardController\|use-keyboard-controller\|use-keyboard-nav\|use-cancel-flow\|use-toggle-all" .beastmode/context/DESIGN.md`
Expected: No matches (exit code 1)

- [x] **Step 5: Commit**

```bash
git add .beastmode/context/DESIGN.md
git commit -m "docs(dashboard-wiring): rewrite DESIGN.md Dashboard section for three-panel model"
```

---

### Task 2: Verify L3 Consistency

**Wave:** 2
**Depends on:** Task 1

**Files:**
- Verify: `.beastmode/context/design/dashboard.md`
- Modify (if needed): `.beastmode/context/design/dashboard.md`

- [x] **Step 1: Read dashboard.md and compare with updated DESIGN.md**

Read `.beastmode/context/design/dashboard.md` and verify:
- References ThreePanelLayout, EpicsPanel, DetailsPanel, LogPanel (not old component names)
- Describes flat navigation model (not push/pop, not view stack)
- Describes use-dashboard-keyboard (not useKeyboardController or old hooks)
- No references to CrumbBar, breadcrumb bar, EpicList/FeatureList/AgentLog as separate views

- [x] **Step 2: Fix any inconsistencies (if found)**

If old references are found, replace them with the correct three-panel terminology. If no issues found, report clean.

- [x] **Step 3: Verify grep clean**

Run: `grep -n "push/pop\|drill-down\|view stack\|breadcrumb\|CrumbBar\|EpicList\|FeatureList\|AgentLog\|useKeyboardController\|use-keyboard-controller\|use-keyboard-nav\|use-cancel-flow\|use-toggle-all" .beastmode/context/design/dashboard.md`
Expected: No matches (exit code 1)

- [x] **Step 4: Commit (if changes made)**

```bash
git add .beastmode/context/design/dashboard.md
git commit -m "docs(dashboard-wiring): fix L3 dashboard.md consistency with L2 rewrite"
```

If no changes needed, skip this step.
