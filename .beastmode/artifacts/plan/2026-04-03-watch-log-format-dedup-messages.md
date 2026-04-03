---
phase: plan
slug: watch-log-format
epic: watch-log-format
feature: dedup-messages
wave: 2
---

# Dedup Messages

**Design:** `.beastmode/artifacts/design/2026-04-03-watch-log-format.md`

## User Stories

3. As an operator watching the pipeline, I want log messages to contain only new information (not repeat what's in the scope and phase columns) so that each line is concise.

## What to Build

Audit every log call site in the watch loop and post-dispatch module. For each call, strip words from the message string that duplicate information already visible in the phase column or scope.

**Watch Loop (`watch.ts`):** The `attachLoggerSubscriber` function creates child loggers with phase/epic/feature context, then includes that same information in the message. Dispatching messages currently say `dispatching implement ${featureSlug}` or `dispatching ${phase}` — with the new format, phase and feature are already in their columns, so these should become just `dispatching`. Completion messages say `${status} ($cost, ${dur}s)` — the status verb is new information, keep it. The phase/epic/feature are already in columns.

**Post-Dispatch (`post-dispatch.ts`):** Messages like `Phase ${opts.phase} failed for ${opts.epicSlug}` repeat phase and epic from the logger context. Strip the redundant parts: `failed — skipping updates`. Similarly for reconciliation (`Reconciled ${opts.phase} for ${opts.epicSlug} → ${result.phase}` becomes `reconciled → ${result.phase}`), design abandon, slug rename, and GitHub sync messages.

**Principle:** Each message should contain only the information that isn't already in the phase column or scope. When in doubt, keep the message — dedup is about removing exact duplicates of structured context, not aggressive shortening.

## Acceptance Criteria

- [ ] Dispatching messages in watch.ts say just "dispatching" (no phase or feature slug in text)
- [ ] Post-dispatch failure message omits phase and epic slug from text
- [ ] Reconciliation message omits phase and epic slug from text
- [ ] Design abandon message omits epic slug from text
- [ ] Slug rename message omits epic slug where it's already in scope
- [ ] No message loses information that isn't available in the phase/scope columns
