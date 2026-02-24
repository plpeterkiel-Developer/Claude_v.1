Feature: Security

  Background:
    Given the database is empty
    And a verified user "Alice" exists

  # ─── Authentication ──────────────────────────────────────────────────────────

  Scenario: Unauthenticated user cannot create a tool listing
    Given a visitor is not logged in
    When they send a POST request to /tools directly
    Then the API returns a 401 Unauthorised response

  Scenario: Unauthenticated user cannot create a borrow request
    Given a visitor is not logged in
    When they send a POST request to /requests
    Then the API returns a 401 Unauthorised response

  # ─── Rate limiting ───────────────────────────────────────────────────────────

  Scenario: Brute force login is blocked after repeated failures
    Given a visitor has failed to log in 5 times with the same email
    When they attempt a 6th login within 15 minutes
    Then the login is blocked and they receive a 'too many attempts' message

  # ─── Address privacy ─────────────────────────────────────────────────────────

  Scenario: Pick-up point address is not accessible via the API without an accepted request
    Given a logged-in user has a pending (not yet accepted) borrow request
    When they call the API endpoint for that tool's details
    Then the response does not include the pick-up point address

  # ─── Authorisation ───────────────────────────────────────────────────────────

  Scenario: User cannot accept another user's request on their behalf
    Given "Alice" owns a tool and there is a pending request from "Bob"
    And a third user "Carol" is logged in
    When "Carol" attempts to accept the request via the API
    Then they receive a 403 Forbidden error

  Scenario: User cannot delete another user's tool listing
    Given "Alice" owns a tool listing
    And "Bob" is logged in
    When "Bob" attempts to DELETE "Alice"'s tool listing
    Then they receive a 403 Forbidden error

  # ─── Request body limits ─────────────────────────────────────────────────────

  Scenario: Oversized request body is rejected
    Given a logged-in user
    When they send a POST request with a body larger than 10kb
    Then the API returns a 413 Payload Too Large response
