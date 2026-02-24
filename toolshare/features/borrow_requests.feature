Feature: Borrow Requests

  Background:
    Given the database is empty
    And a verified user "Alice" owns a tool called "Lawnmower"
    And a verified user "Bob" is browsing the tool

  # ─── Sending requests ────────────────────────────────────────────────────────

  Scenario: User sends a borrow request
    Given a logged-in user views an available tool listing
    When they click 'Request to Borrow' and submit dates and a message
    Then a request record is created and the tool owner receives a notification

  Scenario: Unverified user cannot send a borrow request
    Given a user has registered but not yet verified their email
    When they attempt to submit a borrow request
    Then they are shown a message asking them to verify their email first
    And no request is created

  Scenario: User cannot borrow their own tool
    Given "Alice" is logged in
    When she sends a request to borrow her own "Lawnmower"
    Then they receive a 400 Bad Request error

  Scenario: User cannot send a duplicate pending request
    Given "Bob" has a pending request for "Lawnmower"
    When "Bob" sends another request for the same tool
    Then they receive a 409 Conflict error

  # ─── Accepting and declining ─────────────────────────────────────────────────

  Scenario: Owner accepts a borrow request
    Given a logged-in owner has a pending borrow request on their tool
    When they click 'Accept' on the request
    Then the request status updates to 'Accepted' and the borrower is notified

  Scenario: Borrower receives full pick-up address when request is accepted
    Given a borrower has a pending request on a tool
    When the owner accepts the request
    Then the borrower receives an email containing the full pick-up point address

  Scenario: Owner declines a borrow request
    Given "Alice" has a pending request from "Bob" for "Lawnmower"
    When "Alice" declines the request
    Then the request status changes to 'Declined'
    And "Bob" receives an email notifying them the request was not accepted

  # ─── Cancellation ────────────────────────────────────────────────────────────

  Scenario: Borrower cancels their request before the owner responds
    Given a borrower has a pending request on a tool
    When they click 'Cancel Request' before the owner has accepted or declined
    Then the request status is updated to 'Cancelled'
    And the tool owner receives an email notifying them the request was withdrawn

  Scenario: Borrower cannot cancel an already accepted request
    Given "Bob" has an accepted request for "Lawnmower"
    When "Bob" attempts to cancel the request
    Then they receive a 400 Bad Request error

  # ─── Returning ───────────────────────────────────────────────────────────────

  Scenario: Either party can mark a loan as returned
    Given "Bob" has an accepted request for "Lawnmower"
    When "Alice" marks the loan as returned
    Then the request status changes to 'Returned'
    And the tool status changes back to 'Available'
    And both parties receive an email prompting them to leave a review

  # ─── Account deletion during active request ───────────────────────────────────

  Scenario: Active borrow request is cancelled when lender deletes their account
    Given a borrower has a pending request on a tool
    When the tool owner deletes their account
    Then the request status is updated to 'Cancelled'
    And the borrower receives an email notifying them the request has been cancelled
