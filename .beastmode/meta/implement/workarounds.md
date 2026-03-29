# Implement Workarounds

## Context Compaction State Loss
- ALWAYS verify task state from artifacts (file existence) rather than trusting tasks.json in long sessions — context compaction drops incremental state updates

## Subagent State Coordination
- ALWAYS design parallel dispatch for post-hoc reconciliation, not real-time status updates — subagents cannot reliably write back to shared coordination files
- Worktree isolation also prevents code artifact flow between sequential tasks — orchestrator must merge intermediate results before dispatching dependent tasks

## Plugin Cache Worktree Staleness
- ALWAYS read skill files from worktree path when the feature modifies skill files — plugin cache serves main-branch files, not worktree-local modifications

## Edit/Write Tool File Refusal
- Edit/Write tools may refuse modifications even after reading the file — use Bash heredoc (`cat > file << 'EOF'`) as fallback for complete file rewrites
