Feature: Browse and Search

  Background:
    Given the database is empty
    And several tools are listed by verified users

  Scenario: Guest user can browse available tools
    Given a visitor is not logged in
    When they visit the browse page
    Then they can see all available tool listings but cannot send a request without logging in

  Scenario: Visitor can filter tools by availability
    Given there are 3 available tools and 2 tools currently on loan
    When a visitor filters by 'Available now'
    Then only the 3 available tools are shown

  Scenario: Visitor can search tools by keyword
    Given there is a tool called "Garden Spade" and one called "Lawnmower"
    When a visitor searches for "spade"
    Then only "Garden Spade" is shown in the results

  Scenario: Visitor can filter tools by street name
    Given tools listed at "Elm Street" and "Oak Avenue"
    When a visitor filters by street "Elm Street"
    Then only the "Elm Street" tools are shown

  Scenario: Full pick-up address is never shown in browse results
    Given a tool listing has a full pick-up address "14 Elm Street, Copenhagen 2100"
    When any visitor browses the tool listing
    Then only the street name portion "Elm Street" is visible
    And the house number and postcode are not shown
