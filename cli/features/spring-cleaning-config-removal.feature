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
