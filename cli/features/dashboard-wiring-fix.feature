@dashboard-wiring-fix
Feature: Dashboard wiring — ThreePanelLayout replaces TwoColumnLayout

  App.tsx must render ThreePanelLayout (not TwoColumnLayout) with nyan cat
  rainbow banner, inline panel titles, static overview panel, correct
  proportions, and full terminal height.

  # --- Rainbow nyan banner ---

  Scenario: Nyan banner renders in header
    Given the ThreePanelLayout source is loaded
    When I check the header section
    Then the header contains a NyanBanner component

  Scenario: Rainbow banner uses smooth gradient interpolation across frames
    Given the nyan color runtime is loaded
    When the tick offset advances by 1
    Then the color assigned to charIndex 0 changes
    And adjacent character colors differ by at most one interpolation step

  # --- Three-panel layout proportions ---

  Scenario: Layout uses vertical split with left column and right log panel
    Given the ThreePanelLayout source is loaded
    When I check panel dimensions
    Then the left column width is "35%"
    And the right column width is "65%"
    And within the left column the epics panel takes "60%" of the vertical space
    And within the left column the overview panel takes "40%" of the vertical space
    And the log panel fills the full height of the right column

  # --- Inline panel titles ---

  Scenario: Each panel has an inline title
    Given the ThreePanelLayout source is loaded
    When I check panel titles
    Then the epics panel has title "EPICS"
    And the overview panel has title "OVERVIEW"
    And the log panel has title "LOG"

  # --- Static overview panel ---

  Scenario: Overview panel displays pipeline state
    Given the OverviewPanel source is loaded
    When I check the overview panel content
    Then the overview panel shows "Phase Distribution"
    And the overview panel shows "Sessions"
    And the overview panel shows "Git"

  # --- Full terminal height ---

  Scenario: Log panel renders at full terminal height in the right column
    Given the ThreePanelLayout source is loaded
    When I check the log panel
    Then the log panel fills the full height of the right column
    And the outer container uses a horizontal split layout

  # --- Clock and tick rate ---

  Scenario: Clock updates every 1 second
    Given the App component source is loaded
    When I check the clock effect
    Then the clock interval is 1000 milliseconds
    And the clock format is HH:MM:SS

  Scenario: Dashboard ticks at 80ms intervals
    Given the NyanBanner source is loaded
    When I check the tick interval
    Then the tick interval is 80 milliseconds

  # --- End-to-end verification ---

  Scenario: All dashboard-polish requirements work together
    Given the App component source is loaded
    And the ThreePanelLayout source is loaded
    And the nyan color runtime is loaded
    When I verify all dashboard-polish requirements
    Then App renders ThreePanelLayout as the top-level layout
    And the header contains a NyanBanner component displaying "BEASTMODE" with trailing dots
    And all three panels have self-contained PanelBox borders with clean titles
    And the layout uses a vertical split with left column at "35%" and right column at "65%"
    And the overview panel is a static display component in the left column below epics
    And the log panel fills full height in the right column
    And panel borders use the Monokai Pro gray accent
    And panel titles use the Monokai Pro cyan accent
    And three background depth tiers are visible
    And the outermost container has no chrome border
    And the banner gradient uses smooth 256-step interpolation
