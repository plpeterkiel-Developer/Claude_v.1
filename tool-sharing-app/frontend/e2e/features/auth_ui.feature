Feature: Authentication UI
  As a gardener
  I want to register and log in through the website
  So that I can manage my tools and requests

  Background:
    Given the app is running at "http://localhost:5173"

  Scenario: Registration form is accessible from the home page
    When I visit "/"
    And I click the link "Join free"
    Then the URL should contain "/register"
    And I should see the heading "Create account"

  Scenario: Login form is accessible from the nav
    When I visit "/"
    And I click the link "Log in"
    Then the URL should contain "/login"
    And I should see the heading "Log in"

  Scenario: Register with valid details
    When I visit "/register"
    And I fill in "Your name" with "Garden Tester"
    And I fill in "Email" with "e2e-test@garden.com"
    And I fill in "Password" with "TestPass123!"
    And I click the button "Create account"
    Then the URL should be "/"

  Scenario: Login form shows error for wrong password
    When I visit "/login"
    And I fill in "Email" with "nobody@garden.com"
    And I fill in "Password" with "wrongpass"
    And I click the button "Log in"
    Then I should see an error message
