Feature: User Authentication
  As a gardener
  I want to create an account and log in
  So that I can manage my tools and borrow from my community

  # -------------------------------------------------------
  # Registration
  # -------------------------------------------------------

  Scenario: Register a new account with email and password
    Given the API is running
    When I POST "/auth/register" with body:
      | name     | Alice Gardener   |
      | email    | alice@garden.com |
      | password | GreenThumb99!    |
    Then the response status should be 201
    And the response body should include "name" equal to "Alice Gardener"

  Scenario: Registration requires name, email and password
    Given the API is running
    When I POST "/auth/register" with body:
      | email    | incomplete@garden.com |
    Then the response status should be 400

  Scenario: Cannot register with an email that is already taken
    Given a user exists with email "taken@garden.com" and password "Pass123!"
    When I POST "/auth/register" with body:
      | name     | Bob              |
      | email    | taken@garden.com |
      | password | AnotherPass1!    |
    Then the response status should be 409

  # -------------------------------------------------------
  # Login
  # -------------------------------------------------------

  Scenario: Log in with correct email and password
    Given a user exists with email "charlie@garden.com" and password "Correct99!"
    When I POST "/auth/login" with body:
      | email    | charlie@garden.com |
      | password | Correct99!         |
    Then the response status should be 200
    And the response body should include "email" equal to "charlie@garden.com"

  Scenario: Reject login with a wrong password
    Given a user exists with email "dana@garden.com" and password "RealPass1!"
    When I POST "/auth/login" with body:
      | email    | dana@garden.com |
      | password | WrongPass1!     |
    Then the response status should be 401

  Scenario: Reject login for an unknown email
    Given the API is running
    When I POST "/auth/login" with body:
      | email    | nobody@garden.com |
      | password | SomePass1!        |
    Then the response status should be 401

  # -------------------------------------------------------
  # Session / current user
  # -------------------------------------------------------

  Scenario: Get current user when logged in
    Given I am logged in as "eve@garden.com" with password "EvePass1!"
    When I GET "/auth/me"
    Then the response status should be 200
    And the response body should include "email" equal to "eve@garden.com"

  Scenario: Reject /auth/me when not logged in
    Given the API is running
    When I GET "/auth/me"
    Then the response status should be 401

  # -------------------------------------------------------
  # Logout
  # -------------------------------------------------------

  Scenario: Log out ends the session
    Given I am logged in as "frank@garden.com" with password "FrankPass1!"
    When I POST "/auth/logout" with body:
      |  |
    And I GET "/auth/me"
    Then the response status should be 401
