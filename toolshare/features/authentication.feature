Feature: User Authentication

  Background:
    Given the database is empty

  # ─── Registration ────────────────────────────────────────────────────────────

  Scenario: User registers with email and password
    Given a visitor is on the registration page
    When they submit a valid email and password
    Then a new user account is created and they are redirected to their dashboard

  Scenario: Registration fails with duplicate email
    Given a user account already exists with email "existing@example.com"
    When a visitor registers with email "existing@example.com"
    Then they receive a 409 Conflict error

  Scenario: Registration fails with weak password
    Given a visitor is on the registration page
    When they submit a password shorter than 8 characters
    Then they see a validation error explaining the password requirements

  Scenario: Unverified user cannot list a tool
    Given a user has registered but not yet verified their email
    When they attempt to submit a new tool listing
    Then they are shown a message asking them to verify their email first
    And no listing is created

  # ─── Social login ────────────────────────────────────────────────────────────

  Scenario: User logs in with Google
    Given a visitor clicks 'Continue with Google'
    When they authenticate successfully with their Google account
    Then a user account is created or matched and they are logged in

  # ─── Login & security ────────────────────────────────────────────────────────

  Scenario: Brute force login is blocked after repeated failures
    Given a visitor has failed to log in 5 times with the same email
    When they attempt a 6th login within 15 minutes
    Then the login is blocked and they receive a 'too many attempts' message

  Scenario: Suspended user cannot log in
    Given a user account is suspended
    When they attempt to log in with correct credentials
    Then they receive an error and are not authenticated

  # ─── Email verification ──────────────────────────────────────────────────────

  Scenario: Email verification link activates account
    Given a user registered with email "new@example.com"
    And their verification token is "abc123"
    When they visit the verification link with token "abc123"
    Then their account is marked as email verified
