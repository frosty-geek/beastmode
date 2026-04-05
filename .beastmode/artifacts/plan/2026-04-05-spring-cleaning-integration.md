# Integration Test Artifact: spring-cleaning

Epic: **spring-cleaning**
Date: 2026-04-05

---

## New Scenarios

### US1: cmux dispatch code removal

```gherkin
@spring-cleaning
Feature: cmux dispatch strategy is no longer available

  The cmux dispatch strategy has been removed from the system. Attempting
  to use cmux dispatch should not be possible. The system only supports
  iTerm2-based dispatch.

  Scenario: System does not offer cmux as a dispatch strategy
    Given the dispatch module is loaded
    When a developer queries available dispatch strategies
    Then cmux is not listed as an available strategy

  Scenario: Attempting to dispatch via cmux produces a clear error
    Given a developer configures dispatch strategy as cmux
    When the dashboard attempts to dispatch a phase
    Then the dispatch fails with an unknown strategy error
    And the error message does not suggest cmux as a valid option
```

### US2: SDK dispatch logic removal

```gherkin
@spring-cleaning
Feature: SDK dispatch strategy is no longer available

  SDK-based dispatch (session factory, streaming infrastructure) has been
  removed. The system exclusively uses iTerm2-based dispatch. No SDK
  session creation or streaming pathway exists.

  Scenario: System does not offer SDK as a dispatch strategy
    Given the dispatch module is loaded
    When a developer queries available dispatch strategies
    Then SDK is not listed as an available strategy

  Scenario: Attempting to dispatch via SDK produces a clear error
    Given a developer configures dispatch strategy as SDK
    When the dashboard attempts to dispatch a phase
    Then the dispatch fails with an unknown strategy error
    And the error message does not suggest SDK as a valid option

  Scenario: Dashboard operates without SDK streaming infrastructure
    Given the dashboard is running with an active epic
    When a phase dispatch begins
    Then the dispatch uses iTerm2-based session creation
    And no SDK streaming session is created
```

### US3: watch and status CLI commands removal

```gherkin
@spring-cleaning
Feature: watch and status CLI commands are removed

  The beastmode watch and beastmode status CLI commands have been removed.
  The dashboard is the sole pipeline UI entry point. Attempting to invoke
  the removed commands produces a helpful error.

  Scenario: Invoking the watch command produces an error
    Given the beastmode CLI is available
    When a developer invokes the watch command
    Then the CLI reports that the watch command does not exist
    And the error suggests using the dashboard command instead

  Scenario: Invoking the status command produces an error
    Given the beastmode CLI is available
    When a developer invokes the status command
    Then the CLI reports that the status command does not exist
    And the error suggests using the dashboard command instead

  Scenario: Dashboard remains the sole pipeline UI entry point
    Given the beastmode CLI is available
    When a developer lists available commands
    Then the dashboard command is listed
    And the watch command is not listed
    And the status command is not listed
```

### US4: dispatch-strategy config key and cmux config section removal

```gherkin
@spring-cleaning
Feature: Removed config keys are rejected during config loading

  The dispatch-strategy config key and cmux config section have been
  removed from the configuration schema. Configurations containing
  these keys are treated as invalid.

  Scenario: Config with dispatch-strategy key is rejected
    Given a configuration file contains a dispatch-strategy key
    When the configuration is loaded
    Then the config loader reports an unrecognized key error for dispatch-strategy

  Scenario: Config with cmux section is rejected
    Given a configuration file contains a cmux config section
    When the configuration is loaded
    Then the config loader reports an unrecognized key error for cmux

  Scenario: Config without removed keys loads successfully
    Given a configuration file has no dispatch-strategy key
    And the configuration file has no cmux section
    When the configuration is loaded
    Then the configuration loads without errors
```

### US5: SDK streaming types removed from dispatch module

```gherkin
@spring-cleaning
Feature: Dispatch module contains only iTerm2-relevant abstractions

  SDK streaming types (ring buffer, session emitter, log entry,
  content block) have been removed from the dispatch module. Only
  types relevant to iTerm2-based dispatch remain.

  Scenario: Dispatch module does not expose streaming buffer types
    Given the dispatch module is loaded
    When a developer inspects the module's exported types
    Then no ring buffer type is exported
    And no session emitter type is exported

  Scenario: Dispatch module does not expose SDK log entry types
    Given the dispatch module is loaded
    When a developer inspects the module's exported types
    Then no SDK log entry type is exported
    And no SDK content block type is exported

  Scenario: Dispatch module exports only iTerm2 session types
    Given the dispatch module is loaded
    When a developer inspects the module's exported types
    Then iTerm2 session creation types are exported
    And no SDK-specific types are exported
```

### US6: Session types stripped of events field

```gherkin
@spring-cleaning
Feature: Session types reflect iTerm2-only dispatch

  The dispatched session and session handle types no longer carry an
  events field. Session types contain only the fields relevant to
  iTerm2-based dispatch.

  Scenario: Dispatched session type does not include an events field
    Given the dispatch module defines a dispatched session type
    When a developer inspects the dispatched session fields
    Then no events field is present on the dispatched session

  Scenario: Session handle type does not include an events field
    Given the dispatch module defines a session handle type
    When a developer inspects the session handle fields
    Then no events field is present on the session handle

  Scenario: Existing consumers of session types work without events field
    Given a pipeline component receives a dispatched session
    When the component accesses session lifecycle information
    Then the component operates correctly without an events field
```

### US7: Documentation and knowledge updated

```gherkin
@spring-cleaning
Feature: Project knowledge reflects simplified architecture

  Design docs, context tree entries, and L2/L3 knowledge files are
  updated to reflect the removal of cmux, SDK dispatch, and CLI
  watch/status commands. No stale references to removed capabilities
  remain in the knowledge base.

  Scenario: Design documentation does not reference cmux dispatch
    Given the project design documentation is reviewed
    When a reviewer searches for cmux references
    Then no cmux dispatch references are found

  Scenario: Design documentation does not reference SDK dispatch
    Given the project design documentation is reviewed
    When a reviewer searches for SDK dispatch references
    Then no SDK dispatch references are found

  Scenario: Context tree does not reference removed CLI commands
    Given the project context tree is reviewed
    When a reviewer searches for watch command references
    Then no watch command references are found in the context tree
    When a reviewer searches for status command references
    Then no status command references are found in the context tree

  Scenario: L2 and L3 knowledge files reflect current architecture
    Given the project knowledge hierarchy is reviewed
    When a reviewer checks L2 and L3 knowledge entries
    Then all dispatch-related entries describe iTerm2-only dispatch
    And no entries reference cmux, SDK, or removed CLI commands
```

### US8: Dead test files removed

```gherkin
@spring-cleaning
Feature: Test suite covers only living code

  Test files that exercise removed code paths (cmux dispatch, SDK
  streaming, watch CLI, status CLI) are identified and removed. The
  remaining test suite covers only actively-used code.

  Scenario: No test files exercise cmux dispatch logic
    Given the test suite is reviewed
    When a reviewer searches for tests covering cmux dispatch
    Then no test files covering cmux dispatch exist

  Scenario: No test files exercise SDK streaming infrastructure
    Given the test suite is reviewed
    When a reviewer searches for tests covering SDK streaming
    Then no test files covering SDK streaming exist

  Scenario: No test files exercise the watch CLI command
    Given the test suite is reviewed
    When a reviewer searches for tests covering the watch CLI command
    Then no test files covering the watch CLI command exist

  Scenario: No test files exercise the status CLI command
    Given the test suite is reviewed
    When a reviewer searches for tests covering the status CLI command
    Then no test files covering the status CLI command exist

  Scenario: All remaining test files import only living modules
    Given the test suite is reviewed
    When a reviewer checks test file imports
    Then no test imports reference removed modules
```

---

## Modified Scenarios

### 1. `cli/features/dashboard-dispatch-strategy.feature` -- Scenario Outline: Dashboard dispatches using the configured strategy

**Original file:** `cli/features/dashboard-dispatch-strategy.feature`
**Scenario:** `Scenario Outline: Dashboard dispatches using the configured strategy`

**What changed:** The Examples table listed cmux and sdk as valid strategies. With user stories 1 and 2 removing those strategies, the outline should only contain iTerm2. The Feature description also referenced "(iTerm2, cmux, or sdk)" which must be simplified.

**Updated Gherkin:**

```gherkin
@spring-cleaning
@dashboard-dispatch-fix
Feature: Dashboard dispatches phases using iTerm2 strategy

  The dashboard dispatches phase sessions using the iTerm2 strategy.
  Dispatch uses iTerm2 exclusively, with no alternative strategies.

  Background:
    Given an epic is at phase "plan" and ready for dispatch

  Scenario: Dashboard dispatches using iTerm2 strategy
    Given the dispatch strategy is iTerm2
    When the dashboard dispatches the next phase
    Then the phase session is launched using the iTerm2 strategy
    And no fallback strategy is attempted

  Scenario: Dashboard reports dispatch failure when iTerm2 is unavailable
    Given the iTerm2 strategy is not available on this system
    When the dashboard dispatches the next phase
    Then the dispatch fails with a clear strategy-unavailable error
    And no zombie session is created
```

### 2. `cli/features/dashboard-event-log-panel.feature` -- All scenarios

**Original file:** `cli/features/dashboard-event-log-panel.feature`
**Scenarios:** All four scenarios in the feature

**What changed:** Every scenario had `And SDK streaming is not available` as a precondition, implying SDK streaming was a possible alternative. With user story 2 removing SDK entirely, this precondition is obsolete. The Feature description also referenced SDK streaming as a conditional.

**Updated Gherkin:**

```gherkin
@spring-cleaning
@dashboard-dispatch-fix
Feature: Log panel shows event-based dispatch status

  The log panel shows meaningful status updates for dispatch lifecycle
  events. The panel displays dispatching, completed, and failed states
  based on events.

  Scenario: Log panel shows dispatching status when a phase begins
    Given the dashboard is running with an active epic
    When a phase dispatch begins
    Then the log panel shows a "dispatching" status for that phase

  Scenario: Log panel shows completed status when a phase succeeds
    Given the dashboard is running with an active epic
    When a phase dispatch completes successfully
    Then the log panel shows a "completed" status for that phase

  Scenario: Log panel shows failed status when a phase fails
    Given the dashboard is running with an active epic
    When a phase dispatch fails
    Then the log panel shows a "failed" status for that phase

  Scenario: Log panel transitions through dispatch lifecycle states
    Given the dashboard is running with an active epic
    When a phase dispatch begins
    Then the log panel shows a "dispatching" status for that phase
    When that phase dispatch completes successfully
    Then the log panel shows a "completed" status for that phase
```

---

## Deleted Scenarios

### 1. `cli/features/dashboard-unified-strategy.feature` -- Entire feature file

**Original file:** `cli/features/dashboard-unified-strategy.feature`
**Scenarios deleted:** All 4 scenarios

**Why obsolete:** This feature tested that the dashboard and watch commands used identical strategy selection logic, including cmux and SDK strategies. User story 3 removes the watch command entirely, user stories 1 and 2 remove cmux and SDK strategies, and user story 4 removes the dispatch-strategy config key. The entire behavioral premise -- parity between two UI entry points across three strategies -- no longer applies. The dashboard is the sole entry point and iTerm2 is the sole strategy.

### 2. `cli/features/dashboard-dispatch-strategy.feature` -- Original version (replaced by modified version above)

**Original file:** `cli/features/dashboard-dispatch-strategy.feature`
**Scenarios deleted:** `Scenario Outline: Dashboard dispatches using the configured strategy` (original with cmux/sdk examples)

**Why obsolete:** Replaced by the modified version in the Modified Scenarios section above. The original scenario outline with cmux and sdk in the Examples table is superseded by user stories 1 and 2.
