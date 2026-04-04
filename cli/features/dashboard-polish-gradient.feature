@dashboard-polish
Feature: Banner gradient uses 256-step smooth color interpolation

  The banner animation interpolates between nyan cat rainbow colors using
  256 discrete steps, producing wide bands and a slow, smooth color wash
  effect rather than a flickering rainbow.

  Scenario: Gradient uses 256-step interpolation between color stops
    Given the banner color engine is initialized
    When I query the interpolation palette size
    Then the palette contains 256 color entries

  Scenario: Color bands are wide enough to appear smooth
    Given the banner color engine is initialized
    When I render one frame of the banner gradient
    Then adjacent characters have colors from the interpolated palette

  Scenario: Animation speed produces a slow color wash
    Given the banner color engine is initialized
    When the tick offset advances by 1
    Then the color assigned to charIndex 0 changes
    And the gradient shift per tick is 1 index in a 256-entry palette
