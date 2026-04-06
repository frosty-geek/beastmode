@fix-hook-paths
Feature: Absolute hook path resolution for CLI-dispatched sessions

  CLI-dispatched sessions write hook entries to worktree settings. All hook
  command paths must be absolute, resolved at write time from the CLI's own
  location. This ensures hooks work regardless of working directory,
  environment variables, or symlink configuration.

  Scenario: HITL PreToolUse hook command path is absolute
    Given a PreToolUse hook is built for phase "design"
    Then the hook command should contain an absolute path to "hitl-auto.ts"
    And the hook command should not contain "git rev-parse"

  Scenario: HITL PostToolUse hook command path is absolute
    Given file-permission PostToolUse hooks are built for phase "design"
    Then all hook commands should contain an absolute path to "hitl-log.ts"
    And no hook command should contain "git rev-parse"

  Scenario: Stop hook command path is absolute
    Given HITL settings are written for phase "design"
    Then the Stop hook command should contain an absolute path to "generate-output.ts"
    And the Stop hook command should not contain "git rev-parse"

  Scenario: Hook paths point to existing script files
    Given a PreToolUse hook is built for phase "plan"
    And file-permission PostToolUse hooks are built for phase "plan"
    And HITL settings are written for phase "plan"
    Then all captured hook command paths should reference files that exist on disk

  Scenario: File-permission PostToolUse hook command paths are absolute
    Given file-permission PostToolUse hooks are built for phase "implement"
    Then all hook commands should contain an absolute path to "hitl-log.ts"
    And no hook command should contain "git rev-parse"
