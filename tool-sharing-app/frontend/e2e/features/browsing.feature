Feature: Browsing the tool catalogue
  As a visitor
  I want to browse available gardening tools
  So that I can find equipment to borrow

  Background:
    Given the app is running at "http://localhost:5173"

  Scenario: The home page loads
    When I visit "/"
    Then the page title should contain "Garden Tool Share"
    And I should see "Share the tools"

  Scenario: The tools page shows available tools
    When I visit "/tools"
    Then I should see the heading "Available tools"

  Scenario: Unauthenticated users can see the Browse Tools link
    When I visit "/"
    Then I should see a link "Browse Tools"

  Scenario: Clicking Browse Tools takes the user to the tools page
    When I visit "/"
    And I click the link "Browse Tools"
    Then the URL should contain "/tools"

  Scenario: Unauthenticated users are redirected from protected pages
    When I visit "/my-tools"
    Then the URL should contain "/login"
