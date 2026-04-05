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
