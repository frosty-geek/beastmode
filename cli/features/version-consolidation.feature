@version-awareness
Feature: Version resolution from plugin.json

  All version displays across the CLI and dashboard resolve from
  .claude-plugin/plugin.json as the single source of truth. The shared
  version module discovers plugin.json relative to its own file location
  and formats the result as "v{semver}". When plugin.json is unreadable,
  the module returns "unknown" instead of crashing.

  Scenario: Shared version module exists and exports resolveVersion
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the module exports a "resolveVersion" function

  Scenario: Version module reads from plugin.json
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the module references "plugin.json" in its file read

  Scenario: Version module uses import.meta.dirname for path resolution
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the module uses "import.meta.dirname" for path traversal

  Scenario: CLI help imports the shared version module
    Given the CLI source tree is loaded
    When I examine the CLI entry point at "index.ts"
    Then it imports from the version module
    And it does not contain a hardcoded VERSION constant

  Scenario: Watch loop imports the shared version module
    Given the CLI source tree is loaded
    When I examine the watch loop at "commands/watch-loop.ts"
    Then it imports from the version module
    And it does not contain a local resolveVersion function

  Scenario: Version format is v{semver} without git hash
    Given the CLI source tree is loaded
    When I examine the version module at "version.ts"
    Then the return format matches "v{semver}" pattern
    And the module does not reference "git rev-parse" or "execSync"
